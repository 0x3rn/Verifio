import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { orderSMSCode, checkSMSCode, cancelSMSOrder, resendSMSCode, applyMarkup, getPrice, formatPhoneNumber } from '@/lib/smspool';
import { prisma, getOrder, updateOrder, generateOrderId } from '@/lib/db';
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

    // 1. Get pricing first to determine cost
    let cost = 0;
    try {
      const pricing = await getPrice(country, service);
      cost = pricing.displayPrice;
    } catch {
      // If pricing fails, default to 0 and let balance check fail
    }

    // 2. Check balance before ordering (deduct markup price)
    if (cost <= 0) {
      return NextResponse.json({ error: 'Unable to determine price. Please try again.' }, { status: 400 });
    }

    // 3. Order from SMSpool
    const smspoolOrder = await orderSMSCode(country, service);

    const orderId = generateOrderId();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + (smspoolOrder.expires_in || 600) * 1000).toISOString();
    const phoneStr = String(smspoolOrder.number);
    const formattedPhone = formatPhoneNumber(phoneStr, country);

    // 4. Atomic: verify balance + deduct + save order (all inside transaction)
    await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!dbUser || dbUser.balance < cost) {
        throw new Error('Insufficient balance. Please add funds to your wallet.');
      }

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: cost } },
      });

      await tx.order.create({
        data: {
          id: orderId,
          userId: user.id,
          service,
          country,
          phoneNumber: phoneStr,
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

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { balance: { increment: order.cost } },
        });
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'refunded' },
        });
      });

      return NextResponse.json({ success: true, status: 'refunded', message: 'Balance refunded.' });
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

    // Auto-refund if expired
    if (new Date(order.expiresAt) < new Date()) {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { balance: { increment: order.cost } },
        });
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'refunded' },
        });
      });

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
    const message = error instanceof Error ? error.message : 'Failed to check SMS code.';
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

    await cancelSMSOrder(order.smspoolOrderId);
    await updateOrder(orderId, { status: 'cancelled' });

    return NextResponse.json({ success: true, message: 'Order cancelled.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}