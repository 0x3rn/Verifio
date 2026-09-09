import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  acquireRequestLock,
  consumeRateLimit,
  createPendingProxyExtension,
  failProxyExtensionAndRefund,
  finalizeProxyExtension,
  generateProxyExtensionId,
  getUserProxyOrder,
  releaseRequestLock,
} from '@/lib/db';
import { extendProxyPackage, getProxyDetails, isProxyConfigured } from '@/lib/proxyapp';
import { applyMarkup } from '@/lib/smspool';
import { isSameOriginRequest, requestRateLimitKey } from '@/lib/request-security';

function hasLaterExpiry(candidate: string | undefined, previous: string | null): boolean {
  if (!candidate) return false;
  const nextTime = new Date(candidate).getTime();
  if (!Number.isFinite(nextTime)) return false;
  if (!previous) return true;
  const previousTime = new Date(previous).getTime();
  return Number.isFinite(previousTime) && nextTime > previousTime;
}

export async function POST(request: NextRequest) {
  let purchaseLockKey: string | null = null;
  let extensionId: string | null = null;
  let userId: string | null = null;
  let providerSucceeded = false;

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    userId = user.id;
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    if (!isProxyConfigured()) return NextResponse.json({ error: 'Proxy service is not configured.' }, { status: 503 });

    const allowed = await consumeRateLimit({
      scope: 'proxy-extension',
      key: requestRateLimitKey(request, user.id),
      limit: 5,
      windowSeconds: 30 * 60,
    });
    if (!allowed) return NextResponse.json({ error: 'Too many proxy extension attempts. Please try again later.' }, { status: 429 });

    const locked = await acquireRequestLock({ scope: 'paid-purchase', key: user.id });
    if (!locked) return NextResponse.json({ error: 'Another wallet action is already being processed for this account. Please wait a moment.' }, { status: 409 });
    purchaseLockKey = user.id;

    const body = await request.json().catch(() => null) as { orderId?: unknown } | null;
    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
    if (!orderId) return NextResponse.json({ error: 'A proxy order is required.' }, { status: 400 });

    const order = await getUserProxyOrder(user.id, orderId);
    if (!order || order.status !== 'active' || !order.providerIdentifier) {
      return NextResponse.json({ error: 'That proxy is not available for extension.' }, { status: 400 });
    }

    const proxy = await getProxyDetails(order.providerIdentifier);
    if (!proxy.expires_at || !hasLaterExpiry(proxy.expires_at, new Date().toISOString())) {
      return NextResponse.json({ error: 'That proxy has expired and cannot be extended. Please order a new package.' }, { status: 400 });
    }
    if (!proxy.extend_cost || proxy.extend_cost <= 0) {
      return NextResponse.json({ error: 'The provider did not return a valid extension price for this proxy.' }, { status: 502 });
    }

    const cost = applyMarkup(proxy.extend_cost);
    extensionId = generateProxyExtensionId();
    await createPendingProxyExtension({
      id: extensionId,
      proxyOrderId: order.id,
      userId: user.id,
      providerIdentifier: order.providerIdentifier,
      cost,
      previousExpiresAt: proxy.expires_at,
    });

    let providerResult;
    try {
      providerResult = await extendProxyPackage(order.providerIdentifier);
      providerSucceeded = true;
    } catch (error) {
      try {
        const reconciled = await getProxyDetails(order.providerIdentifier);
        if (hasLaterExpiry(reconciled.expires_at, proxy.expires_at)) {
          providerSucceeded = true;
          const reconciledOrder = await finalizeProxyExtension({ id: extensionId, userId: user.id, newExpiresAt: reconciled.expires_at! });
          if (reconciledOrder) return NextResponse.json({ order: reconciledOrder, extensionPrice: cost, reconciled: true });
        }
      } catch {
        // Keep the pending debit when the provider result is unknowable. This prevents a timeout
        // from refunding a successful provider extension and lets support reconcile it safely.
      }
      if (providerSucceeded) {
        return NextResponse.json({ error: 'The provider extended the proxy, but the local record needs support reconciliation before another attempt.' }, { status: 500 });
      }
      await failProxyExtensionAndRefund(extensionId, user.id);
      extensionId = null;
      const message = error instanceof Error ? error.message : 'Proxy provider could not extend this package.';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const newExpiresAt = providerResult.expires_at || (await getProxyDetails(order.providerIdentifier)).expires_at;
    if (!newExpiresAt || !hasLaterExpiry(newExpiresAt, proxy.expires_at)) {
      return NextResponse.json({ error: 'The provider confirmed the request without returning a valid new expiry. Contact support before retrying.' }, { status: 502 });
    }

    const updatedOrder = await finalizeProxyExtension({ id: extensionId, userId: user.id, newExpiresAt });
    if (!updatedOrder) {
      return NextResponse.json({ error: 'The proxy was extended, but we could not update its local record. Contact support before retrying.' }, { status: 500 });
    }
    extensionId = null;
    return NextResponse.json({ order: updatedOrder, extensionPrice: cost });
  } catch (error) {
    if (extensionId && userId && !providerSucceeded) await failProxyExtensionAndRefund(extensionId, userId);
    const message = error instanceof Error ? error.message : 'Failed to extend proxy.';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (purchaseLockKey) await releaseRequestLock({ scope: 'paid-purchase', key: purchaseLockKey });
  }
}
