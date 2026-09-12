import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET /api/auth/me failed', error);
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
  }
}
