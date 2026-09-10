import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

const baseUrl = (process.env.AUTH_TEST_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const testId = randomUUID().replaceAll('-', '').slice(0, 12);
const email = `better_auth_${testId}@example.invalid`;
const username = `ba_test_${testId}`;
const password = `BetterAuthTest!${testId}9`;
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL is required.');

const sql = postgres(connectionString, { max: 1, connect_timeout: 15, prepare: false });
let userId: string | null = null;

function sessionCookie(response: Response): string | null {
  const header = response.headers as Headers & { getSetCookie?: () => string[] };
  const values = header.getSetCookie?.() || [];
  if (values.length > 0) return values.map((value) => value.split(';', 1)[0]).join('; ');
  const combined = response.headers.get('set-cookie');
  return combined ? combined.split(/, (?=[^;]+?=)/).map((value) => value.split(';', 1)[0]).join('; ') : null;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Expected JSON response from Better Auth, received HTTP ${response.status}.`);
  }
}

async function main() {
  try {
    const signup = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: baseUrl },
      body: JSON.stringify({
        email,
        name: username,
        username,
        displayUsername: username,
        password,
      }),
    });
    const signupBody = await readJson(signup);
    if (!signup.ok) throw new Error(`Signup failed with HTTP ${signup.status}: ${String(signupBody.message || signupBody.code || 'unknown error')}`);

    const signedUpUser = signupBody.user;
    if (!signedUpUser || typeof signedUpUser !== 'object' || !('id' in signedUpUser) || typeof signedUpUser.id !== 'string') {
      throw new Error('Signup response did not include a user ID.');
    }
    userId = signedUpUser.id;

    const [authRows] = await Promise.all([
      sql<{ id: string; username: string }[]>`SELECT id, username FROM auth_users WHERE id = ${userId} AND email = ${email}`,
    ]);
    if (authRows.length !== 1 || authRows[0].username !== username) throw new Error('Better Auth user row was not persisted correctly.');

    const appRows = await sql<{ id: string; username: string; email: string | null }[]>`
      SELECT id, username, email FROM users WHERE id = ${userId}
    `;
    if (appRows.length !== 1 || appRows[0].username !== username || appRows[0].email !== email) {
      throw new Error('Verifio application profile row was not synchronized.');
    }

    const cookie = sessionCookie(signup);
    if (!cookie) throw new Error('Signup did not return a session cookie.');
    const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, { headers: { cookie } });
    const sessionBody = await readJson(sessionResponse);
    const sessionUser = sessionBody.user;
    if (!sessionResponse.ok || !sessionUser || typeof sessionUser !== 'object' || !('id' in sessionUser) || sessionUser.id !== userId) {
      throw new Error(`Session verification failed with HTTP ${sessionResponse.status}.`);
    }

    const profileResponse = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    const profileBody = await readJson(profileResponse);
    const profile = profileBody.user;
    if (!profileResponse.ok || !profile || typeof profile !== 'object' || !('id' in profile) || profile.id !== userId || !('username' in profile) || profile.username !== username || !('email' in profile) || profile.email !== email) {
      throw new Error(`Verifio profile endpoint verification failed with HTTP ${profileResponse.status}.`);
    }

    const signout = await fetch(`${baseUrl}/api/auth/sign-out`, {
      method: 'POST',
      headers: { cookie, origin: baseUrl, 'content-type': 'application/json' },
      body: '{}',
    });
    if (!signout.ok) throw new Error(`Sign-out failed with HTTP ${signout.status}.`);

    for (const credentials of [
      { path: 'email', payload: { email, password } },
      { path: 'username', payload: { username, password } },
    ]) {
      const signIn = await fetch(`${baseUrl}/api/auth/sign-in/${credentials.path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: baseUrl },
        body: JSON.stringify(credentials.payload),
      });
      const signInBody = await readJson(signIn);
      if (!signIn.ok) throw new Error(`${credentials.path} sign-in failed with HTTP ${signIn.status}: ${String(signInBody.message || signInBody.code || 'unknown error')}`);

      const signInCookie = sessionCookie(signIn);
      if (!signInCookie) throw new Error(`${credentials.path} sign-in did not return a session cookie.`);
      const signedInSession = await fetch(`${baseUrl}/api/auth/get-session`, { headers: { cookie: signInCookie } });
      const signedInBody = await readJson(signedInSession);
      const signedInUser = signedInBody.user;
      if (!signedInSession.ok || !signedInUser || typeof signedInUser !== 'object' || !('id' in signedInUser) || signedInUser.id !== userId) {
        throw new Error(`${credentials.path} session verification failed with HTTP ${signedInSession.status}.`);
      }

      const signInSignout = await fetch(`${baseUrl}/api/auth/sign-out`, {
        method: 'POST',
        headers: { cookie: signInCookie, origin: baseUrl, 'content-type': 'application/json' },
        body: '{}',
      });
      if (!signInSignout.ok) throw new Error(`${credentials.path} sign-out failed with HTTP ${signInSignout.status}.`);
    }

    console.log('Better Auth signup, email sign-in, username sign-in, session, and cleanup integration passed.');
  } finally {
    if (userId) {
      await sql`DELETE FROM users WHERE id = ${userId}`;
      await sql`DELETE FROM auth_users WHERE id = ${userId}`;
    } else {
      await sql`DELETE FROM users WHERE email = ${email}`;
      await sql`DELETE FROM auth_users WHERE email = ${email}`;
    }
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('Better Auth integration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
