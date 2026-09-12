export const FRESH_AUTH_COOKIE = 'verifio_fresh_auth';

function secureAttribute(): string {
  return typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
}

export function markFreshAuthNavigation(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${FRESH_AUTH_COOKIE}=1; Path=/dashboard; Max-Age=60; SameSite=Lax${secureAttribute()}`;
}

export function clearFreshAuthNavigation(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${FRESH_AUTH_COOKIE}=; Path=/dashboard; Max-Age=0; SameSite=Lax${secureAttribute()}`;
}
