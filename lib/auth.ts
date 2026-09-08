import { auth, currentUser } from '@clerk/nextjs/server';
import { upsertUser } from '@/lib/db';
import type { User } from './types';

function checkIsAdmin(userId: string): boolean {
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map((value) => value.trim()).filter(Boolean) || [];
  return adminIds.includes(userId);
}

function toPublicUser(user: { id: string; username: string; email: string | null; balanceCents: string | number; createdAt: Date | string; updatedAt: Date | string }): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email || undefined,
    balance: Number(user.balanceCents) / 100,
    isAdmin: checkIsAdmin(user.id),
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date(user.updatedAt).toISOString(),
  };
}

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  // Clerk is the identity source. Neon holds only the profile and application
  // state (wallet, orders, rentals). This synchronous upsert avoids webhook
  // delivery races on a user's first request while keeping profile changes fresh.
  const clerkUser = await currentUser();
  if (!clerkUser || !clerkUser.username) {
    throw new Error('CLERK_USERNAME_REQUIRED');
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const profile = await upsertUser({ id: userId, username: clerkUser.username, email });
  return toPublicUser(profile);
}
