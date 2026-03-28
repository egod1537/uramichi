import type { GoogleUser } from '../models/Plan';

const storageKey = 'uramichi.google-user';

export function readStoredGoogleUser(): GoogleUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as GoogleUser) : null;
  } catch {
    return null;
  }
}

export function writeStoredGoogleUser(user: GoogleUser | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(user));
}
