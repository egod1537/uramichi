let googleIdentityPromise: Promise<google.accounts.id.IdConfiguration | google.accounts.id.GoogleAccountsId> | undefined;

export function loadGoogleIdentityServices(): Promise<google.accounts.id.GoogleAccountsId> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity Services can only be loaded in the browser.'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }

  if (googleIdentityPromise) {
    return googleIdentityPromise as Promise<google.accounts.id.GoogleAccountsId>;
  }

  googleIdentityPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-identity-loader="true"]');

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentityLoader = 'true';
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.append(script);

    function handleLoad() {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
        return;
      }

      googleIdentityPromise = undefined;
      reject(new Error('Google Identity Services did not initialize correctly.'));
    }

    function handleError() {
      googleIdentityPromise = undefined;
      reject(new Error('Failed to load the Google Identity Services script.'));
    }
  });

  return googleIdentityPromise as Promise<google.accounts.id.GoogleAccountsId>;
}
