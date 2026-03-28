export function isDebugEnabledFromLocation(search?: string): boolean {
  const resolvedSearch =
    typeof search === 'string'
      ? search
      : typeof window !== 'undefined'
        ? window.location.search
        : '';

  return new URLSearchParams(resolvedSearch).get('debug') === '1';
}
