import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { orderSMSCode, checkSMSCode, cancelSMSOrder, resendSMSCode } from '@/lib/smspool';
import { prisma, saveOrder, getOrder, updateOrder, generateOrderId } from '@/lib/db';
import type { VerificationOrder } from '@/lib/types';

// Order new SMS verification
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const body = await request.json();
    const { country, service } = body;

    if (!country || !service) {
      return NextResponse.json(
        { error: 'Country and service are required.' },
        { status: 400 }
      );
    }

    // Call SMSpool to order a number
    const smspoolOrder = await orderSMSCode(country, service);

    const cost = smspoolOrder.price;
    const orderId = generateOrderId();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + smspoolOrder.expires_in * 1000).toISOString();

    // Atomic: save order + deduct balance in a single transaction
    await prisma.$transaction(async (tx) => {
      // Check and deduct balance
      const dbUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!dbUser || dbUser.balance < cost) {
        throw new Error('Insufficient balance. Please add funds to your wallet.');
      }

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: cost } },
      });

      // Save order
      await tx.order.create({
        data: {
          id: orderId,
          userId: user.id,
          service,
          country,
          phoneNumber: smspoolOrder.number,
          code: null,
          status: 'waiting_for_code',
          type: 'sms',
          cost,
          smspoolOrderId: smspoolOrder.order_id,
          createdAt: new Date(now),
          completedAt: null,
          expiresAt: new Date(expiresAt),
        },
      });
    });

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        phoneNumber: smspoolOrder.number,
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
  }
}

// Get SMS code for an order
export async function GET(request: NextRequest) {
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

    // Check for the verification code
    const smsData = await checkSMSCode(order.smspoolOrderId);

    if (smsData.success === 1 && smsData.code) {
      await updateOrder(orderId, {
        code: smsData.code,
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        code: smsData.code,
        fullSms: smsData.full_sms,
        status: 'completed',
      });
    }

    // Check if expired
    if (new Date(order.expiresAt) < new Date()) {
      await updateOrder(orderId, { status: 'expired' });
      return NextResponse.json({
        success: false,
        message: 'Order has expired.',
        status: 'expired',
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Code not yet received.',
      status: 'waiting_for_code',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check SMS code.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Cancel or resend
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

// Resend code
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    await resendSMSCode(order.smspoolOrderId);

    return NextResponse.json({ success: true, message: 'Code resend requested.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resend code.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}