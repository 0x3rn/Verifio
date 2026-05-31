import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserOrders } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const orders = await getUserOrders(user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}