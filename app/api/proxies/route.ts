import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  acquireRequestLock,
  consumeRateLimit,
  createPendingProxyOrder,
  failProxyOrderAndRefund,
  finalizeProxyOrder,
  generateProxyOrderId,
  getUserProxyOrders,
  releaseRequestLock,
} from '@/lib/db';
import { applyMarkup, calculateProxyExtensionPrice, calculateProxyPricing } from '@/lib/smspool';
import { getProxyDetails, getProxyPackages, isProxyConfigured, orderProxyPackage, PROXY_PACKAGE_FEATURES } from '@/lib/proxyapp';
import { isSameOriginRequest, requestRateLimitKey } from '@/lib/request-security';

function toPublicPackage(packageData: { id: number; name: string; gb: number; price: number; rate_per_gb: number; length_days: number }) {
  const pricing = calculateProxyPricing(packageData.price, packageData.gb);
  return {
    id: packageData.id,
    name: packageData.name,
    bandwidthGb: packageData.gb,
    price: pricing.displayPrice,
    displayPrice: pricing.displayPrice,
    ratePerGb: pricing.ratePerGb,
    lengthDays: packageData.length_days,
    features: [...PROXY_PACKAGE_FEATURES],
    extendable: true,
    extensionDays: 30,
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    if (!isProxyConfigured()) return NextResponse.json({ error: 'Proxy service is not configured.' }, { status: 503 });

    const [packages, orders] = await Promise.all([getProxyPackages(), getUserProxyOrders(user.id)]);
    const details = await Promise.all(orders.map(async (order) => {
      if (!order.providerIdentifier || order.status !== 'active') return null;
      try {
        const proxy = await getProxyDetails(order.providerIdentifier);
        return {
          orderId: order.id,
          proxy,
          extensionPrice: proxy.extend_cost && proxy.extend_cost > 0 ? calculateProxyExtensionPrice(order.cost) : null,
        };
      } catch {
        return null;
      }
    }));

    return NextResponse.json({
      packages: packages.map(toPublicPackage),
      orders,
      credentials: details.filter((item): item is NonNullable<typeof item> => Boolean(item)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load proxy plans.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  let purchaseLockKey: string | null = null;
  let pendingOrderId: string | null = null;
  let userId: string | null = null;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    userId = user.id;
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    if (!isProxyConfigured()) return NextResponse.json({ error: 'Proxy service is not configured.' }, { status: 503 });

    const allowed = await consumeRateLimit({
      scope: 'proxy-order',
      key: requestRateLimitKey(request, user.id),
      limit: 5,
      windowSeconds: 30 * 60,
    });
    if (!allowed) return NextResponse.json({ error: 'Too many proxy orders. Please try again later.' }, { status: 429 });

    const locked = await acquireRequestLock({ scope: 'paid-purchase', key: user.id });
    if (!locked) return NextResponse.json({ error: 'A purchase is already being processed for this account. Please wait a moment.' }, { status: 409 });
    purchaseLockKey = user.id;

    const body = await request.json().catch(() => null) as { packageId?: unknown } | null;
    const packageId = typeof body?.packageId === 'number' ? body.packageId : Number(body?.packageId);
    if (!Number.isInteger(packageId) || packageId <= 0) return NextResponse.json({ error: 'A valid proxy package is required.' }, { status: 400 });

    const packages = await getProxyPackages();
    const packageData = packages.find((item) => item.id === packageId);
    if (!packageData) return NextResponse.json({ error: 'That proxy package is no longer available.' }, { status: 400 });

    const cost = applyMarkup(packageData.price);
    pendingOrderId = generateProxyOrderId();
    await createPendingProxyOrder({
      id: pendingOrderId,
      userId: user.id,
      packageId: packageData.id,
      packageName: packageData.name,
      bandwidthGb: packageData.gb,
      cost,
    });

    let proxy;
    try {
      proxy = await orderProxyPackage(packageData.id);
    } catch (error) {
      await failProxyOrderAndRefund(pendingOrderId, user.id);
      pendingOrderId = null;
      const message = error instanceof Error ? error.message : 'Proxy provider could not fulfill the package.';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const order = await finalizeProxyOrder({
      id: pendingOrderId,
      userId: user.id,
      providerIdentifier: proxy.id,
      expiresAt: proxy.expires_at || null,
    });
    if (!order) {
      await failProxyOrderAndRefund(pendingOrderId, user.id);
      pendingOrderId = null;
      return NextResponse.json({ error: 'The proxy was created, but we could not save its account record. Contact support before retrying.' }, { status: 500 });
    }
    pendingOrderId = null;

    return NextResponse.json({ order, credential: proxy }, { status: 201 });
  } catch (error) {
    if (pendingOrderId && userId) await failProxyOrderAndRefund(pendingOrderId, userId);
    const message = error instanceof Error ? error.message : 'Failed to order proxy package.';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (purchaseLockKey) await releaseRequestLock({ scope: 'paid-purchase', key: purchaseLockKey });
  }
}
