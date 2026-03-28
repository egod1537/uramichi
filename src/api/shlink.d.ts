export interface ShlinkConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
}

export interface CreateShortUrlOptions {
  crawlable?: boolean;
  customSlug?: string;
  findIfExists?: boolean;
  forwardQuery?: boolean;
  tags?: string[];
  title?: string;
}

export interface ShlinkShortUrl {
  shortUrl: string;
  shortCode: string;
  longUrl: string;
}

export function getShlinkConfig(): ShlinkConfig;

export function createShortUrl(
  longUrl: string,
  options?: string | CreateShortUrlOptions,
): Promise<ShlinkShortUrl>;

export function listShortUrls(page?: number): Promise<unknown>;

export function getVisits(shortCode: string): Promise<unknown>;

export function deleteShortUrl(shortCode: string): Promise<boolean>;
