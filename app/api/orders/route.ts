import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserOrders } from '@/lib/store';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const orders = getUserOrders(user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}