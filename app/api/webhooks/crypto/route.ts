import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSign } from '@/lib/cryptomus';

// Cryptomus sends webhook callbacks when payment status changes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('sign') || '';

    // Verify the webhook signature
    if (!verifyWebhookSign(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const { order_id, status, amount } = body;

    // Only process completed payments
    if (status !== 'paid' && status !== 'paid_over') {
      return NextResponse.json({ message: 'Payment not yet completed' }, { status: 200 });
    }

    // Parse our order ID format: deposit_{userId}_{timestamp}
    const parts = order_id?.split('_');
    if (!parts || parts.length < 3 || parts[0] !== 'deposit') {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    const userId = parts[1];

    // Credit the user's balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: parseFloat(amount) || 0,
        },
      },
    });

    return NextResponse.json({ message: 'Payment processed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}