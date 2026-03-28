declare global {
  interface Window {
    google?: typeof google;
    gm_authFailure?: () => void;
    __uramichiGoogleMapsInit?: () => void;
  }
}

export {};
