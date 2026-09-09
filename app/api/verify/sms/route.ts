import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { orderSMSCode, checkSMSCode, cancelSMSOrder, applyMarkup, getPrice, formatPhoneNumber, getCountries, getServices } from '@/lib/smspool';
import { cancelTextVerifiedOrder, checkTextVerifiedCode, getTextVerifiedPrice, orderTextVerifiedCode } from '@/lib/textverified';
import { acquireRequestLock, completeOrder, consumeRateLimit, countActiveOrders, createOrderWithDebit, generateOrderId, getOrder, refundOrder, releaseRequestLock, updateOrder } from '@/lib/db';
import { isSameOriginRequest, requestRateLimitKey } from '@/lib/request-security';

interface VerificationCodeResponse {
  success: number;
  code?: string;
  sms?: string;
  full_sms?: string;
}

// Order new SMS verification
export async function POST(request: NextRequest) {
  let purchaseLockKey: string | null = null;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    }
    const allowed = await consumeRateLimit({
      scope: 'sms-order', key: requestRateLimitKey(request, user.id), limit: 10, windowSeconds: 10 * 60,
    });
    if (!allowed) {
      return NextResponse.json({ error: 'Too many verification requests. Please try again shortly.' }, { status: 429 });
    }
    const locked = await acquireRequestLock({ scope: 'paid-purchase', key: user.id });
    if (!locked) {
      return NextResponse.json({ error: 'A purchase is already being processed for this account. Please wait a moment.' }, { status: 409 });
    }
    purchaseLockKey = user.id;

    const body = await request.json();
    const { country, service, provider: requestedProvider = 'smspool' } = body;

    if (!country || !service) {
      return NextResponse.json(
        { error: 'Country and service are required.' },
        { status: 400 }
      );
    }

    // Check active order limit
    const activeOrdersCount = await countActiveOrders(user.id);
    if (activeOrdersCount >= 5) {
      return NextResponse.json(
        { error: 'You have reached the limit of 5 active orders. Please complete or cancel existing orders.' },
        { status: 400 }
      );
    }

    if (requestedProvider !== 'smspool' && requestedProvider !== 'textverified') {
      return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 });
    }

    const smspoolServices = await getServices();
    const serviceData = smspoolServices.find(s => String(s.ID) === String(service));
    const serviceName = serviceData?.name || String(service);

    // 1. Get provider pricing first to determine cost
    let cost = 0;
    try {
      if (requestedProvider === 'textverified') {
        const countries = await getCountries();
        const countryCode = countries.find((item) => String(item.ID) === String(country))?.short_name || String(country);
        if (countryCode.toUpperCase() !== 'US') {
          return NextResponse.json({ error: 'Text Verified currently supports US numbers only.' }, { status: 400 });
        }
        const pricing = await getTextVerifiedPrice(serviceName);
        cost = applyMarkup(pricing.basePrice);
      } else {
        const pricing = await getPrice(country, service);
        cost = pricing.displayPrice;
      }
    } catch {
      // If pricing fails, default to 0 and let balance check fail
    }

    // 2. Check balance before ordering (deduct markup price)
    if (cost <= 0) {
      return NextResponse.json({ error: 'Unable to determine price. Please try again.' }, { status: 400 });
    }

    let upstreamOrder;
    const provider = requestedProvider;

    try {
      if (requestedProvider === 'textverified') {
        upstreamOrder = await orderTextVerifiedCode(serviceName);
      } else {
        upstreamOrder = await orderSMSCode(country, service);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to order number.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const orderId = generateOrderId();
    const now = new Date().toISOString();
    const providerExpiry = 'expires_at' in upstreamOrder ? upstreamOrder.expires_at : undefined;
    const expiresAt = providerExpiry || new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const phoneStr = String(upstreamOrder.number);
    
    // Resolve ISO code for formatting
    const countriesList = await getCountries();
    const countryData = countriesList.find((c) => String(c.ID) === String(country));
    const isoCode = countryData?.short_name || '';
    
    const formattedPhone = formatPhoneNumber(phoneStr, isoCode);

    // 4. Atomic: verify balance + deduct + save order (all inside transaction)
    await createOrderWithDebit({ id: orderId, userId: user.id, service, country, phoneNumber: phoneStr, code: '', status: 'waiting_for_code', type: 'sms', cost, smspoolOrderId: String(upstreamOrder.order_id), provider, createdAt: now, completedAt: null, expiresAt });

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        phoneNumber: formattedPhone,
        rawNumber: phoneStr,
        service,
        country,
        status: 'waiting_for_code',
        cost,
        expiresAt,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to order SMS verification.';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (purchaseLockKey) await releaseRequestLock({ scope: 'paid-purchase', key: purchaseLockKey });
  }
}

// Get SMS code for an order, or auto-refund if expired
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const action = searchParams.get('action');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Handle refund action
    if (action === 'refund') {
      if (order.status === 'completed' || order.status === 'refunded') {
        return NextResponse.json({ error: 'Order has already been completed or refunded.' }, { status: 400 });
      }

      const refunded = await refundOrder(orderId, user.id);
      if (!refunded) return NextResponse.json({ error: 'Order status changed before refund.' }, { status: 409 });

      return NextResponse.json({ success: true, status: 'refunded', message: 'Balance refunded.' });
    }

    // Check for the verification code
    let codeData: VerificationCodeResponse;
    if (order.provider === 'textverified') {
      codeData = await checkTextVerifiedCode(order.smspoolOrderId);
    } else {
      codeData = await checkSMSCode(order.smspoolOrderId);
    }

    if (codeData.success === 1 && codeData.code) {
      await completeOrder(orderId, codeData.code);

      return NextResponse.json({
        success: true,
        code: codeData.code,
        fullSms: codeData.sms || codeData.full_sms,
        status: 'completed',
      });
    }

    // Auto-refund if expired
    if (new Date(order.expiresAt) < new Date()) {
      await refundOrder(orderId, user.id);

      return NextResponse.json({
        success: false,
        message: 'Order has expired. Balance refunded.',
        status: 'refunded',
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Code not yet received.',
      status: 'waiting_for_code',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve code.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Cancel order
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.provider === 'textverified') {
      await cancelTextVerifiedOrder(order.smspoolOrderId);
    } else {
      await cancelSMSOrder(order.smspoolOrderId);
    }
    await updateOrder(orderId, { status: 'cancelled' });

    return NextResponse.json({ success: true, message: 'Order cancelled.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
