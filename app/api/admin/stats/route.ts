import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSystemStats } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const stats = await getSystemStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch system stats.' }, { status: 500 });
  }
}
