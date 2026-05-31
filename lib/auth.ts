import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import type { User } from './types';

const TOKEN_COOKIE = 'verifio_token';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'verifio-super-secret-key-12345');

// Hash password
async function hashPassword(password: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(password + 'verifio_salt').digest('hex');
}

// Verify password
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}

// JWT Token encode
export async function encodeToken(payload: { userId: string; username: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// JWT Token decode
export async function decodeToken(token: string): Promise<{ userId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; username: string };
  } catch {
    return null;
  }
}

// Register a new user
export async function registerUser(
  username: string,
  password: string,
  email?: string
): Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return { success: false, error: 'An account with this username already exists.' };
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return { success: false, error: 'An account with this email already exists.' };
      }
    }

    const hashedPassword = await hashPassword(password);

    const dbUser = await prisma.user.create({
      data: {
        username,
        email: email || undefined,
        password: hashedPassword,
        balance: 0,
      },
    });

    const token = await encodeToken({ userId: dbUser.id, username: dbUser.username });

    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email || undefined,
      name: undefined,
      balance: dbUser.balance,
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
    };

    return { success: true, token, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'An unexpected error occurred during registration.' };
  }
}

// Login user
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
  try {
    const dbUser = await prisma.user.findUnique({ where: { username } });

    if (!dbUser) {
      return { success: false, error: 'Invalid username or password.' };
    }

    const isValid = await verifyPassword(password, dbUser.password);
    if (!isValid) {
      return { success: false, error: 'Invalid username or password.' };
    }

    const token = await encodeToken({ userId: dbUser.id, username: dbUser.username });

    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email || undefined,
      name: undefined,
      balance: dbUser.balance,
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
    };

    return { success: true, token, user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}

// Get current user from cookie
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;

    if (!token) return null;

    const decoded = await decodeToken(token);
    if (!decoded) return null;

    const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email || undefined,
      name: undefined,
      balance: dbUser.balance,
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

// Clear auth cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}

export { hashPassword };