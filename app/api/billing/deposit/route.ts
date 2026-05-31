import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createPayment } from '@/lib/cryptomus';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Please provide a valid amount greater than 0.' }, { status: 400 });
    }

    if (amount < 5) {
      return NextResponse.json({ error: 'Minimum deposit amount is $5.00.' }, { status: 400 });
    }

    const orderId = `deposit_${user.id}_${Date.now()}`;
    const payment = await createPayment(amount, orderId);

    if (payment.state !== 0) {
      return NextResponse.json({ error: 'Failed to create payment.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payment: {
        orderId: payment.result.order_id,
        paymentUrl: payment.result.url,
        amount: payment.result.amount,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create deposit.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}