import { NextRequest, NextResponse } from 'next/server';
import { creditPaymentIfPending, getPaymentByProviderOrderId } from '@/lib/db';
import { verifyWebhookSign } from '@/lib/cryptomus';

// Cryptomus sends webhook callbacks when payment status changes
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }
    const payload = body as Record<string, unknown>;
    const signature = request.headers.get('sign') || '';

    // Verify the webhook signature
    if (!verifyWebhookSign(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const orderId = typeof payload.order_id === 'string' ? payload.order_id : '';
    const status = typeof payload.status === 'string' ? payload.status : '';
    const amount = typeof payload.amount === 'string' || typeof payload.amount === 'number'
      ? Number(payload.amount)
      : Number.NaN;

    // Only process completed payments
    if (status !== 'paid' && status !== 'paid_over') {
      return NextResponse.json({ message: 'Payment not yet completed' }, { status: 200 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    const payment = await getPaymentByProviderOrderId(orderId);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (Math.abs(payment.amount - amount) > 0.001) {
      return NextResponse.json({ error: 'Payment amount does not match invoice' }, { status: 400 });
    }

    const result = await creditPaymentIfPending(orderId, amount);
    if (result === 'amount_mismatch') return NextResponse.json({ error: 'Payment amount does not match invoice' }, { status: 400 });
    if (result === 'not_found' || result === 'user_not_found') return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    return NextResponse.json({ message: result === 'credited' ? 'Payment processed successfully' : 'Payment already processed' }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
