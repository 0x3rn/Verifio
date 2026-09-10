import type { NextRequest } from 'next/server';

/** Browser mutations must originate from this application, not another site. */
export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return Boolean(origin) && origin === request.nextUrl.origin;
}

/**
 * Rate limiting always includes the authenticated user ID. The IP is a
 * secondary signal, not an identity claim, and is stored only as a one-way
 * hash by consumeRateLimit().
 */
export function requestRateLimitKey(request: NextRequest, userId?: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const address = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return `${userId || 'anonymous'}:${address}`;
}
