import { NextRequest, NextResponse } from 'next/server';
import { loginUser, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const result = await loginUser(username, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    await setAuthCookie(result.token!);

    return NextResponse.json({ user: result.user, token: result.token });
  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}