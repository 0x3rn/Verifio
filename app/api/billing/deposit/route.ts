import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createPayment } from '@/lib/cryptomus';
import { consumeRateLimit, createPendingPayment } from '@/lib/db';
import { randomUUID } from 'node:crypto';
import { isSameOriginRequest, requestRateLimitKey } from '@/lib/request-security';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    }
    const allowed = await consumeRateLimit({
      scope: 'deposit', key: requestRateLimitKey(request, user.id), limit: 5, windowSeconds: 15 * 60,
    });
    if (!allowed) {
      return NextResponse.json({ error: 'Too many deposit attempts. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { amount } = body;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Please provide a valid amount greater than 0.' }, { status: 400 });
    }

    if (amount < 5) {
      return NextResponse.json({ error: 'Minimum deposit amount is $5.00.' }, { status: 400 });
    }
    if (amount > 5_000) {
      return NextResponse.json({ error: 'The maximum single deposit is $5,000.00.' }, { status: 400 });
    }

    const normalizedAmount = Math.round(amount * 100) / 100;
    const orderId = `deposit_${randomUUID()}`;
    const payment = await createPayment(normalizedAmount, orderId);

    if (payment.state !== 0) {
      return NextResponse.json({ error: 'Failed to create payment.' }, { status: 500 });
    }

    await createPendingPayment({
      userId: user.id,
      providerOrderId: payment.result.order_id,
      amount: normalizedAmount,
      currency: 'USD',
      status: 'pending',
      providerPaymentId: payment.result.uuid,
    });

    return NextResponse.json({
      success: true,
      payment: {
        orderId: payment.result.order_id,
        paymentUrl: payment.result.url,
        amount: normalizedAmount,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create deposit.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
