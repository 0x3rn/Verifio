import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { amount } = await request.json();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
    }

    const { id: targetUserId } = await params;

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { balance: { increment: parsedAmount } },
    });

    return NextResponse.json({ success: true, newBalance: updatedUser.balance });
  } catch (error) {
    console.error('Admin update balance error:', error);
    return NextResponse.json({ error: 'Failed to update balance.' }, { status: 500 });
  }
}
