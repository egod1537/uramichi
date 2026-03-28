const DEFAULT_OPEN_WEBUI_BASE_URL = 'http://localhost:8080';
const DEFAULT_OPEN_WEBUI_MODEL = 'qwen3:8b';

function readEnv(name) {
  const value = import.meta.env?.[name];
  return typeof value === 'string' ? value.trim() : '';
}

function readBooleanEnv(name, fallback) {
  const value = readEnv(name);

  if (!value) {
    return fallback;
  }

  const normalized = value.toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function normalizeTextContent(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      if (part?.type === 'text' && typeof part.text === 'string') {
        return part.text;
      }

      return '';
    })
    .join('');
}

function buildHeaders(apiKey) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

async function readErrorMessage(response) {
  const text = await response.text();
  return text || response.statusText || 'Unknown error';
}

function parseStreamLine(line, onChunk, state) {
  const trimmed = line.trim();

  if (!trimmed.startsWith('data:')) {
    return;
  }

  const payload = trimmed.slice(5).trim();

  if (!payload || payload === '[DONE]') {
    return;
  }

  try {
    const json = JSON.parse(payload);
    const content = normalizeTextContent(json?.choices?.[0]?.delta?.content);

    if (!content) {
      return;
    }

    state.full += content;
    onChunk(content);
  } catch {
    // Skip malformed SSE chunks instead of breaking the whole stream.
  }
}

export function getOpenWebUIConfig() {
  return {
    apiKey: readEnv('VITE_OPEN_WEBUI_API_KEY'),
    baseUrl: readEnv('VITE_OPEN_WEBUI_BASE_URL') || DEFAULT_OPEN_WEBUI_BASE_URL,
    model: readEnv('VITE_OPEN_WEBUI_MODEL') || DEFAULT_OPEN_WEBUI_MODEL,
    webSearch: readBooleanEnv('VITE_OPEN_WEBUI_WEB_SEARCH', true),
  };
}

export function createOpenWebUIClient(options = {}) {
  return new OpenWebUI(options);
}

export class OpenWebUI {
  constructor(options = {}) {
    const envConfig = getOpenWebUIConfig();
    const {
      apiKey = envConfig.apiKey,
      baseUrl = envConfig.baseUrl,
      model = envConfig.model,
      webSearch = envConfig.webSearch,
    } = options;

    this.apiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    this.baseUrl = (baseUrl || DEFAULT_OPEN_WEBUI_BASE_URL).replace(/\/+$/, '');
    this.model = model || DEFAULT_OPEN_WEBUI_MODEL;
    this.webSearch = Boolean(webSearch);
  }

  _buildMessages(input) {
    if (typeof input === 'string') {
      const content = input.trim();

      if (!content) {
        throw new TypeError('OpenWebUI input cannot be an empty string.');
      }

      return [{ role: 'user', content }];
    }

    if (!Array.isArray(input) || input.length === 0) {
      throw new TypeError('OpenWebUI input must be a string or a non-empty messages array.');
    }

    return input.map((message, index) => {
      if (!message || typeof message !== 'object') {
        throw new TypeError(`Message at index ${index} must be an object.`);
      }

      if (typeof message.role !== 'string' || !message.role.trim()) {
        throw new TypeError(`Message at index ${index} is missing a valid role.`);
      }

      if (!('content' in message)) {
        throw new TypeError(`Message at index ${index} is missing content.`);
      }

      return message;
    });
  }

  _buildBody(messages, { stream = false, model, webSearch } = {}) {
    return {
      model: model ?? this.model,
      messages,
      stream,
      ...(webSearch ?? this.webSearch ? { features: { web_search: true } } : {}),
    };
  }

  async _request(messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/chat/completions`, {
      method: 'POST',
      headers: buildHeaders(this.apiKey),
      body: JSON.stringify(this._buildBody(messages, options)),
    });

    if (!response.ok) {
      throw new Error(`OpenWebUI error ${response.status}: ${await readErrorMessage(response)}`);
    }

    return response;
  }

  async chat(input, options = {}) {
    const messages = this._buildMessages(input);
    const response = await this._request(messages, { stream: false, ...options });
    const data = await response.json();
    const content = normalizeTextContent(data?.choices?.[0]?.message?.content);

    if (!content) {
      throw new Error('OpenWebUI returned an empty response.');
    }

    return content;
  }

  async stream(input, onChunk, options = {}) {
    if (typeof onChunk !== 'function') {
      throw new TypeError('OpenWebUI stream requires an onChunk callback.');
    }

    const messages = this._buildMessages(input);
    const response = await this._request(messages, { stream: true, ...options });

    if (!response.body) {
      throw new Error('OpenWebUI streaming response body is missing.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const state = { full: '' };
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        buffer += decoder.decode();

        if (buffer.trim()) {
          parseStreamLine(buffer, onChunk, state);
        }

        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        parseStreamLine(line, onChunk, state);
      }
    }

    return state.full;
  }
}
