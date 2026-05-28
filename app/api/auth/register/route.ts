import { NextRequest, NextResponse } from 'next/server';
import { registerUser, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const result = await registerUser(email, password, name);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    await setAuthCookie(result.token!);

    return NextResponse.json({ user: result.user, token: result.token }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}