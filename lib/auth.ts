import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { Pool } from 'pg';
import { headers } from 'next/headers';
import { upsertUser } from '@/lib/db';
import type { User } from './types';

function createAuthPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('AUTH_DATABASE_CONFIG_MISSING: Set DATABASE_URL for Better Auth.');
  }

  // Neon commonly supplies `sslmode=require`. node-postgres translates that
  // query parameter to `rejectUnauthorized: false`, but Cloudflare Workers'
  // node:tls implementation rejects that option entirely. Strip TLS query
  // parameters and enable TLS with the boolean form so node-postgres relies on
  // the runtime's secure defaults without forwarding unsupported options.
  const databaseUrl = new URL(connectionString);
  databaseUrl.searchParams.delete('sslmode');
  databaseUrl.searchParams.delete('sslcert');
  databaseUrl.searchParams.delete('sslkey');
  databaseUrl.searchParams.delete('sslrootcert');
  databaseUrl.searchParams.delete('uselibpqcompat');

  // Cloudflare TCP sockets belong to the request that opened them. This pool is
  // deliberately not cached on globalThis; callers close it before the request
  // finishes so a later request cannot receive a stale Worker socket.
  return new Pool({
    connectionString: databaseUrl.toString(),
    ssl: true,
    max: 1,
    connectionTimeoutMillis: 6_000,
  });
}

const applicationUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const configuredHost = (() => {
  try {
    return new URL(applicationUrl).host;
  } catch {
    return 'localhost:3001';
  }
})();

function createAuth(pool: Pool) {
  return betterAuth({
    appName: 'Verifio',
    baseURL: {
      allowedHosts: [configuredHost, 'verifio.corstack.dev', 'localhost:3000', 'localhost:3001'],
      fallback: applicationUrl,
      protocol: 'auto',
    },
    secret: process.env.BETTER_AUTH_SECRET,
    database: pool,
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
}

async function withRequestAuth<T>(callback: (requestAuth: ReturnType<typeof createAuth>) => Promise<T>): Promise<T> {
  const pool = createAuthPool();
  const requestAuth = createAuth(pool);

  try {
    return await callback(requestAuth);
  } finally {
    await pool.end();
  }
}

export async function handleAuthRequest(request: Request): Promise<Response> {
  return withRequestAuth((requestAuth) => requestAuth.handler(request));
}

function isAdmin(userId: string): boolean {
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map((value) => value.trim()).filter(Boolean) || [];
  return adminIds.includes(userId);
}

export async function getCurrentUser(): Promise<User | null> {
  const requestHeaders = await headers();
  const session = await withRequestAuth((requestAuth) => requestAuth.api.getSession({ headers: requestHeaders }));
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
