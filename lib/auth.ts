import { auth, clerkClient, currentUser, verifyToken } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { getUserById, upsertUser } from '@/lib/db';
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
  const { userId: cookieUserId } = await auth();
  let userId = cookieUserId;

  // Client-side dashboard requests also send a Clerk bearer token. If the
  // session cookie has not reached the request yet, verify that token before
  // falling back to the database profile. This prevents a valid session from
  // being treated as a logout during the first request after navigation.
  if (!userId) {
    const authorization = (await headers()).get('authorization');
    const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (bearerToken) {
      try {
        const verifiedToken = await verifyToken(bearerToken, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        if (typeof verifiedToken.sub === 'string') userId = verifiedToken.sub;
      } catch {
        return null;
      }
    }
  }

  if (!userId) return null;

  if (!cookieUserId) {
    const profile = await getUserById(userId);
    if (profile) return toPublicUser(profile);

    const clerkUser = await (await clerkClient()).users.getUser(userId);
    if (!clerkUser.username) throw new Error('CLERK_USERNAME_REQUIRED');
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
    const createdProfile = await upsertUser({ id: userId, username: clerkUser.username, email });
    return toPublicUser(createdProfile);
  }

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
