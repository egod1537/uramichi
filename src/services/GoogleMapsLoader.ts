let googleMapsPromise: Promise<typeof google.maps> | undefined;
const callbackName = '__uramichiGoogleMapsInit';
const loadTimeoutMs = 10000;
const availabilityPollIntervalMs = 100;

function readLoadedMapsApi(): typeof google.maps | null {
  const mapsApi = window.google?.maps;

  if (!mapsApi || typeof mapsApi.Map !== 'function') {
    return null;
  }

  return mapsApi;
}

export function loadGoogleMapsApi(apiKey: string): Promise<typeof google.maps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in the browser.'));
  }

  const loadedMapsApi = readLoadedMapsApi();

  if (loadedMapsApi) {
    return Promise.resolve(loadedMapsApi);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    let settled = false;
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-loader="true"]',
    );
    const previousAuthFailure = window.gm_authFailure;
    let timeoutId = 0;
    let pollIntervalId = 0;

    const rejectWithMessage = (message: string) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      googleMapsPromise = undefined;
      reject(new Error(message));
    };

    const resolveIfMapsReady = () => {
      if (settled) {
        return true;
      }

      const nextMapsApi = readLoadedMapsApi();

      if (!nextMapsApi) {
        return false;
      }

      settled = true;
      cleanup();
      resolve(nextMapsApi);

      return true;
    };

    window.gm_authFailure = () => {
      if (settled) {
        previousAuthFailure?.();
        return;
      }

      rejectWithMessage(
        'Google Maps API authentication failed. Check the API key, Maps JavaScript API enablement, and referrer restrictions.',
      );
      previousAuthFailure?.();
    };

    if (existingScript) {
      window[callbackName] = handleCallback;
      existingScript.addEventListener('load', handleScriptLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      startAvailabilityPolling();
      return;
    }

    const script = document.createElement('script');
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=${callbackName}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = 'true';
    window[callbackName] = handleCallback;
    script.addEventListener('load', handleScriptLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.append(script);
    startAvailabilityPolling();

    function handleCallback() {
      if (resolveIfMapsReady()) {
        return;
      }

      startAvailabilityPolling();
    }

    function handleScriptLoad() {
      if (resolveIfMapsReady()) {
        return;
      }

      startAvailabilityPolling();
    }

    function handleError() {
      rejectWithMessage('Failed to load the Google Maps script.');
    }

    function startAvailabilityPolling() {
      if (pollIntervalId) {
        return;
      }

      pollIntervalId = window.setInterval(() => {
        resolveIfMapsReady();
      }, availabilityPollIntervalMs);

      timeoutId = window.setTimeout(() => {
        if (resolveIfMapsReady()) {
          return;
        }

        rejectWithMessage(
          'Google Maps loaded too slowly or did not finish initializing. Check the API key, Maps JavaScript API enablement, and referrer restrictions.',
        );
      }, loadTimeoutMs);
    }

    function cleanup() {
      delete window[callbackName];

      if (pollIntervalId) {
        window.clearInterval(pollIntervalId);
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      if (previousAuthFailure) {
        window.gm_authFailure = previousAuthFailure;
      } else {
        delete window.gm_authFailure;
      }
    }
  });

  return googleMapsPromise;
}
