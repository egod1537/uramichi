export interface OpenWebUIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  webSearch: boolean;
}

export interface OpenWebUIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenWebUIRequestOptions {
  stream?: boolean;
  model?: string;
  webSearch?: boolean;
}

export interface OpenWebUIClient {
  chat(input: string | OpenWebUIMessage[], options?: OpenWebUIRequestOptions): Promise<string>;
  stream(
    input: string | OpenWebUIMessage[],
    onChunk: (chunk: string) => void,
    options?: OpenWebUIRequestOptions,
  ): Promise<string>;
}

export function getOpenWebUIConfig(): OpenWebUIConfig;

export function createOpenWebUIClient(
  options?: Partial<OpenWebUIConfig>,
): OpenWebUIClient;

