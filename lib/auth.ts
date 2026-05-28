import { cookies } from 'next/headers';
import type { User, StoredUser } from './types';

const TOKEN_COOKIE = 'verifio_token';

// Simple in-memory user store (in production, use a real database)
const getUsers = (): Map<string, StoredUser> => {
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as Record<string, unknown>).__verifio_users) {
      (globalThis as Record<string, unknown>).__verifio_users = new Map<string, StoredUser>();
    }
    return (globalThis as Record<string, unknown>).__verifio_users as Map<string, StoredUser>;
  }
  return new Map<string, StoredUser>();
};

// Simple token-based auth using Base64 (in production, use JWT)
function encodeToken(payload: { userId: string; email: string }): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  return Buffer.from(data).toString('base64');
}

function decodeToken(token: string): { userId: string; email: string; exp: number } | null {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

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

// Generate unique ID
function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Register a new user
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
  const users = getUsers();

  for (const user of users.values()) {
    if (user.email === email) {
      return { success: false, error: 'An account with this email already exists.' };
    }
  }

  const id = generateId();
  const hashedPassword = await hashPassword(password);
  const now = new Date().toISOString();

  const storedUser: StoredUser = {
    id,
    email,
    name,
    password: hashedPassword,
    balance: 0,
    createdAt: now,
    updatedAt: now,
  };

  users.set(id, storedUser);

  const token = encodeToken({ userId: id, email });

  const user: User = {
    id: storedUser.id,
    email: storedUser.email,
    name: storedUser.name,
    balance: storedUser.balance,
    createdAt: storedUser.createdAt,
    updatedAt: storedUser.updatedAt,
  };

  return { success: true, token, user };
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
  const users = getUsers();

  let foundUser: StoredUser | undefined;
  for (const user of users.values()) {
    if (user.email === email) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const isValid = await verifyPassword(password, foundUser.password);
  if (!isValid) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const token = encodeToken({ userId: foundUser.id, email: foundUser.email });

  const user: User = {
    id: foundUser.id,
    email: foundUser.email,
    name: foundUser.name,
    balance: foundUser.balance,
    createdAt: foundUser.createdAt,
    updatedAt: foundUser.updatedAt,
  };

  return { success: true, token, user };
}

// Get current user from cookie
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;

    if (!token) return null;

    const decoded = decodeToken(token);
    if (!decoded) return null;

    const users = getUsers();
    const storedUser = users.get(decoded.userId);
    if (!storedUser) return null;

    const user: User = {
      id: storedUser.id,
      email: storedUser.email,
      name: storedUser.name,
      balance: storedUser.balance,
      createdAt: storedUser.createdAt,
      updatedAt: storedUser.updatedAt,
    };

    return user;
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

export { encodeToken, decodeToken, hashPassword };