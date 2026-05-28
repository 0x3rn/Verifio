import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { orderSMSCode, getSMSCode, cancelSMSOrder, resendSMSCode } from '@/lib/smspool';
import { saveOrder, getOrder, updateOrder, generateOrderId } from '@/lib/store';
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

    const orderId = generateOrderId();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + smspoolOrder.expires_in * 1000).toISOString();

    const order: VerificationOrder = {
      id: orderId,
      userId: user.id,
      service,
      country,
      phoneNumber: smspoolOrder.number,
      code: '',
      status: 'waiting_for_code',
      type: 'sms',
      cost: smspoolOrder.price,
      smspoolOrderId: smspoolOrder.order_id,
      createdAt: now,
      completedAt: null,
      expiresAt,
    };

    saveOrder(order);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        phoneNumber: order.phoneNumber,
        service: order.service,
        country: order.country,
        status: order.status,
        cost: order.cost,
        expiresAt: order.expiresAt,
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

    const order = getOrder(orderId);
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Check SMSPool for the code
    const smsData = await getSMSCode(order.smspoolOrderId);

    if (smsData.success === 1 && smsData.code) {
      updateOrder(orderId, {
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
      updateOrder(orderId, { status: 'expired' });
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

    const order = getOrder(orderId);
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    await cancelSMSOrder(order.smspoolOrderId);
    updateOrder(orderId, { status: 'cancelled' });

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

    const order = getOrder(orderId);
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