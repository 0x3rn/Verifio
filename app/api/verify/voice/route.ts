import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { orderVoiceCode, checkVoiceCode, cancelSMSOrder, getPrice, formatPhoneNumber, getCountries } from '@/lib/smspool';
import { acquireRequestLock, completeOrder, consumeRateLimit, countActiveOrders, createOrderWithDebit, generateOrderId, getOrder, refundOrder, releaseRequestLock, updateOrder } from '@/lib/db';
import { isSameOriginRequest, requestRateLimitKey } from '@/lib/request-security';

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
      scope: 'voice-order', key: requestRateLimitKey(request, user.id), limit: 10, windowSeconds: 10 * 60,
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
    const { country, service } = body;

    if (!country || !service) {
      return NextResponse.json({ error: 'Country and service are required.' }, { status: 400 });
    }

    // Check active order limit
    const activeOrdersCount = await countActiveOrders(user.id);
    if (activeOrdersCount >= 5) {
      return NextResponse.json(
        { error: 'You have reached the limit of 5 active orders. Please complete or cancel existing orders.' },
        { status: 400 }
      );
    }

    // Get pricing first
    let cost = 0;
    try {
      const pricing = await getPrice(country, service);
      cost = pricing.displayPrice;
    } catch {
      // if pricing fails, default to 0 and let balance check fail
    }

    if (cost <= 0) {
      return NextResponse.json({ error: 'Unable to determine price. Please try again.' }, { status: 400 });
    }

    const voiceOrder = await orderVoiceCode(country, service);

    const orderId = generateOrderId();
    const now = new Date().toISOString();
    // Hardcode 5-minute timer
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const phoneStr = String(voiceOrder.number);
    
    // Resolve ISO code for formatting
    const countriesList = await getCountries();
    const countryData = countriesList.find((c) => String(c.ID) === String(country));
    const isoCode = countryData?.short_name || '';
    
    const formattedPhone = formatPhoneNumber(phoneStr, isoCode);

    // Atomic: verify balance + deduct + save order (all inside transaction)
    await createOrderWithDebit({ id: orderId, userId: user.id, service, country, phoneNumber: phoneStr, code: '', status: 'waiting_for_code', type: 'voice', cost, smspoolOrderId: String(voiceOrder.order_id), provider: 'smspool', createdAt: now, completedAt: null, expiresAt });

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
    let message = error instanceof Error ? error.message : 'Failed to order voice verification.';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (purchaseLockKey) await releaseRequestLock({ scope: 'paid-purchase', key: purchaseLockKey });
  }
}

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

    // Handle refund
    if (action === 'refund') {
      if (order.status === 'completed' || order.status === 'refunded') {
        return NextResponse.json({ error: 'Order has already been completed or refunded.' }, { status: 400 });
      }

      const refunded = await refundOrder(orderId, user.id);
      if (!refunded) return NextResponse.json({ error: 'Order status changed before refund.' }, { status: 409 });

      return NextResponse.json({ success: true, status: 'refunded', message: 'Balance refunded.' });
    }

    const voiceData = await checkVoiceCode(order.smspoolOrderId);

    if (voiceData.success === 1 && voiceData.code) {
      await completeOrder(orderId, voiceData.code);

      return NextResponse.json({
        success: true,
        code: voiceData.code,
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
      message: 'Voice code not yet received.',
      status: 'waiting_for_code',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check voice code.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    await cancelSMSOrder(order.smspoolOrderId);
    await updateOrder(orderId, { status: 'cancelled' });

    return NextResponse.json({ success: true, message: 'Order cancelled.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
