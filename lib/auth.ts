import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { Pool } from 'pg';
import { headers } from 'next/headers';
import { upsertUser } from '@/lib/db';
import type { User } from './types';

type AuthGlobal = typeof globalThis & {
  __verifioAuthPool?: Pool;
};

function getAuthPool(): Pool {
  const globalForAuth = globalThis as AuthGlobal;
  if (!globalForAuth.__verifioAuthPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('AUTH_DATABASE_CONFIG_MISSING: Set DATABASE_URL for Better Auth.');
    }
    globalForAuth.__verifioAuthPool = new Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 20_000,
    });
  }
  return globalForAuth.__verifioAuthPool;
}

const applicationUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const configuredHost = (() => {
  try {
    return new URL(applicationUrl).host;
  } catch {
    return 'localhost:3001';
  }
})();

export const auth = betterAuth({
  appName: 'Verifio',
  baseURL: {
    allowedHosts: [configuredHost, 'verifio.corstack.dev', 'localhost:3000', 'localhost:3001'],
    fallback: applicationUrl,
    protocol: 'auto',
  },
  secret: process.env.BETTER_AUTH_SECRET,
  database: getAuthPool(),
  user: {
    modelName: 'auth_users',
  },
  session: {
    modelName: 'auth_sessions',
  },
  account: {
    modelName: 'auth_accounts',
  },
  verification: {
    modelName: 'auth_verifications',
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 15,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 32,
    }),
  ],
  trustedOrigins: [
    `http://${configuredHost}`,
    `https://${configuredHost}`,
    'http://localhost:3000',
    'http://localhost:3001',
    'https://verifio.corstack.dev',
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          const usernameValue = 'username' in createdUser && typeof createdUser.username === 'string'
            ? createdUser.username
            : createdUser.name;
          await upsertUser({
            id: createdUser.id,
            username: usernameValue,
            email: createdUser.email,
          });
        },
      },
    },
  },
});

function isAdmin(userId: string): boolean {
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map((value) => value.trim()).filter(Boolean) || [];
  return adminIds.includes(userId);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const usernameValue = 'username' in session.user && typeof session.user.username === 'string'
    ? session.user.username
    : session.user.name;
  if (!usernameValue) throw new Error('AUTH_USERNAME_REQUIRED');

  const profile = await upsertUser({
    id: session.user.id,
    username: usernameValue,
    email: session.user.email || null,
  });

  return {
    id: profile.id,
    username: profile.username,
    email: profile.email || undefined,
    balance: Number(profile.balanceCents) / 100,
    isAdmin: isAdmin(profile.id),
    createdAt: new Date(profile.createdAt).toISOString(),
    updatedAt: new Date(profile.updatedAt).toISOString(),
  };
}
