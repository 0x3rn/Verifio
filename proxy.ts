import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const protectedPaths = ['/dashboard', '/api/verify', '/api/rentals', '/api/orders'];
const authPaths = ['/login', '/register'];

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'verifio-super-secret-key-12345');

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('verifio_token')?.value;

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // If trying to access a protected route without a token, redirect to login
  if (isProtectedPath) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    try {
      await jwtVerify(token, JWT_SECRET);
    } catch (err) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('verifio_token');
      return res;
    }
  }

  // If already logged in and trying to access auth pages, redirect to dashboard
  if (isAuthPath && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // Token invalid, clear it and let them hit the auth page
      const res = NextResponse.next();
      res.cookies.delete('verifio_token');
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/api/verify/:path*',
    '/api/rentals/:path*',
    '/api/orders/:path*',
  ],
};