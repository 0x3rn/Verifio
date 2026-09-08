import { createHash, randomUUID } from 'node:crypto';
import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) throw new Error('DIRECT_URL is required to check security controls.');

  const sql = postgres(connectionString, { max: 1, connect_timeout: 15, prepare: false });
  const key = createHash('sha256').update(`security-check:${randomUUID()}`).digest('hex');

  try {
    const [first] = await sql<{ lockKey: string }[]>`
      INSERT INTO request_locks (lock_key, expires_at, updated_at)
      VALUES (${key}, NOW() + (30 * INTERVAL '1 second'), NOW())
      ON CONFLICT (lock_key) DO UPDATE
      SET expires_at = NOW() + (30 * INTERVAL '1 second'), updated_at = NOW()
      WHERE request_locks.expires_at <= NOW()
      RETURNING lock_key AS "lockKey"
    `;
    const [second] = await sql<{ lockKey: string }[]>`
      INSERT INTO request_locks (lock_key, expires_at, updated_at)
      VALUES (${key}, NOW() + (30 * INTERVAL '1 second'), NOW())
      ON CONFLICT (lock_key) DO UPDATE
      SET expires_at = NOW() + (30 * INTERVAL '1 second'), updated_at = NOW()
      WHERE request_locks.expires_at <= NOW()
      RETURNING lock_key AS "lockKey"
    `;
    await sql`DELETE FROM request_locks WHERE lock_key = ${key}`;

    if (!first || second) throw new Error('Purchase lock did not enforce single in-flight ownership.');
    console.log('Purchase lock correctly allows one request and blocks a concurrent second request.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('Security check failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
