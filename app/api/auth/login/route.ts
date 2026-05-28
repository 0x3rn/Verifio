import { NextRequest, NextResponse } from 'next/server';
import { loginUser, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const result = await loginUser(email, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    await setAuthCookie(result.token!);

    return NextResponse.json({ user: result.user, token: result.token });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}