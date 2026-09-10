import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/db';
import { checkProxyBlocklist, normalizeProxyBlocklistTarget, ProxyBlocklistInputError } from '@/lib/proxyapp';
import { isSameOriginRequest, requestRateLimitKey } from '@/lib/request-security';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });

    const body = await request.json().catch(() => null) as { url?: unknown } | null;
    if (typeof body?.url !== 'string') return NextResponse.json({ error: 'Enter a domain or URL to check.' }, { status: 400 });

    try {
      normalizeProxyBlocklistTarget(body.url);
    } catch (error) {
      if (error instanceof ProxyBlocklistInputError) return NextResponse.json({ error: error.message }, { status: 400 });
      throw error;
    }

    const allowed = await consumeRateLimit({
      scope: 'proxy-blocklist',
      key: requestRateLimitKey(request, user.id),
      limit: 30,
      windowSeconds: 10 * 60,
    });
    if (!allowed) return NextResponse.json({ error: 'Too many blacklist checks. Please try again later.' }, { status: 429 });

    return NextResponse.json(await checkProxyBlocklist(body.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to check this domain right now.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
