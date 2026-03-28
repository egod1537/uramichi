function readEnv(name) {
  const value = import.meta.env?.[name];
  return typeof value === 'string' ? value.trim() : '';
}

function readTimeoutMs() {
  const rawValue = readEnv('VITE_SHLINK_TIMEOUT_MS');
  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return 8000;
  }

  return parsedValue;
}

export function getShlinkConfig() {
  return {
    baseUrl: readEnv('VITE_SHLINK_URL').replace(/\/+$/, ''),
    apiKey: readEnv('VITE_SHLINK_API_KEY'),
    timeoutMs: readTimeoutMs(),
  };
}

function assertShlinkConfigured() {
  const config = getShlinkConfig();

  if (!config.baseUrl) {
    throw new Error('Missing VITE_SHLINK_URL.');
  }

  if (!config.apiKey) {
    throw new Error('Missing VITE_SHLINK_API_KEY.');
  }

  return config;
}

function buildRequestUrl(baseUrl, path, query) {
  const url = new URL(path, `${baseUrl}/`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function readResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text) {
    return null;
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(text);
  }

  return text;
}

async function request(path, options = {}) {
  const { baseUrl, apiKey, timeoutMs } = assertShlinkConfigured();
  const { body, headers, query, ...restOptions } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort('timeout');
  }, timeoutMs);

  try {
    const response = await fetch(buildRequestUrl(baseUrl, path, query), {
      ...restOptions,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-Api-Key': apiKey,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(headers ?? {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const responseBody = await readResponseBody(response);

    if (!response.ok) {
      const message =
        typeof responseBody === 'string'
          ? responseBody
          : responseBody?.detail || responseBody?.title || response.statusText;
      throw new Error(`Shlink error ${response.status}: ${message || 'Unknown error'}`);
    }

    return responseBody;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Shlink request timed out after ${timeoutMs}ms.`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function assertLongUrl(longUrl) {
  if (typeof longUrl !== 'string' || !longUrl.trim()) {
    throw new TypeError('longUrl must be a non-empty string.');
  }
}

function assertShortCode(shortCode) {
  if (typeof shortCode !== 'string' || !shortCode.trim()) {
    throw new TypeError('shortCode must be a non-empty string.');
  }

  return encodeURIComponent(shortCode.trim());
}

function normalizePage(page) {
  const normalized = Number.parseInt(page, 10);

  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new TypeError('page must be a positive integer.');
  }

  return normalized;
}

function normalizeCreateShortUrlOptions(options) {
  if (typeof options === 'string') {
    return {
      customSlug: options,
    };
  }

  if (!options || typeof options !== 'object') {
    return {};
  }

  return options;
}

export async function createShortUrl(longUrl, options) {
  assertLongUrl(longUrl);
  const { crawlable, customSlug, findIfExists = true, forwardQuery = true, tags, title } =
    normalizeCreateShortUrlOptions(options);

  return request('/rest/v3/short-urls', {
    method: 'POST',
    body: {
      longUrl: longUrl.trim(),
      customSlug: typeof customSlug === 'string' && customSlug.trim() ? customSlug.trim() : undefined,
      crawlable: typeof crawlable === 'boolean' ? crawlable : undefined,
      findIfExists: Boolean(findIfExists),
      forwardQuery: Boolean(forwardQuery),
      tags:
        Array.isArray(tags) && tags.length > 0
          ? tags.filter((tag) => typeof tag === 'string' && tag.trim())
          : undefined,
      title: typeof title === 'string' && title.trim() ? title.trim() : undefined,
    },
  });
}

export async function listShortUrls(page = 1) {
  return request('/rest/v3/short-urls', {
    query: { page: normalizePage(page) },
  });
}

export async function getVisits(shortCode) {
  return request(`/rest/v3/short-urls/${assertShortCode(shortCode)}/visits`);
}

export async function deleteShortUrl(shortCode) {
  await request(`/rest/v3/short-urls/${assertShortCode(shortCode)}`, {
    method: 'DELETE',
  });

  return true;
}
