import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma, getOrder } from '@/lib/db';
import { cancelSMSOrder } from '@/lib/smspool';

export async function POST(request: NextRequest) {
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

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    if (order.status !== 'waiting_for_code') {
      return NextResponse.json({ error: 'Only waiting orders can be cancelled.' }, { status: 400 });
    }

    // Attempt to cancel on SMSPool
    try {
      await cancelSMSOrder(order.smspoolOrderId);
    } catch (cancelError) {
      const msg = cancelError instanceof Error ? cancelError.message : String(cancelError);
      // SMSPool might say it's already cancelled or completed.
      // We log it and optionally proceed or fail depending on strictness.
      console.warn(`SMSPool cancel failed for ${order.smspoolOrderId}: ${msg}`);
      // If it fails because the order doesn't exist or already completed, we shouldn't refund if it actually completed.
      // For safety, if SMSPool cancellation throws, we return the error to the client.
      return NextResponse.json({ error: `Failed to cancel upstream order: ${msg}` }, { status: 400 });
    }

    // Atomic transaction: Mark as cancelled and refund user
    await prisma.$transaction(async (tx) => {
      // Re-fetch to ensure it hasn't changed status concurrently
      const currentOrder = await tx.order.findUnique({ where: { id: order.id } });
      if (currentOrder?.status !== 'waiting_for_code') {
        throw new Error('Order status changed during cancellation.');
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
        },
      });

      // Refund the cost
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: order.cost } },
      });
    });

    return NextResponse.json({ success: true, message: 'Order cancelled and refunded.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
