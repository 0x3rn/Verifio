import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) throw new Error('DIRECT_URL is required to apply Neon migrations.');

  const migrationNames = ['001_initial_neon.sql', '002_clerk_auth_and_rate_limits.sql', '003_paid_action_locks.sql', '004_proxy_orders.sql', '005_proxy_extensions.sql', '006_textverified_rentals.sql', '007_textverified_duration_enum.sql', '008_pending_rentals.sql'];
  const sql = postgres(connectionString, { max: 1, connect_timeout: 15, prepare: false });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    for (const migrationName of migrationNames) {
      const migrationPath = join(process.cwd(), 'migrations', migrationName);
      const sqlText = await readFile(migrationPath, 'utf8');
      const checksum = createHash('sha256').update(sqlText).digest('hex');
      const [existing] = await sql<{ checksum: string }[]>`
        SELECT checksum FROM schema_migrations WHERE name = ${migrationName}
      `;

      if (existing) {
        if (existing.checksum !== checksum) {
          throw new Error(`${migrationName} was already applied with a different checksum. Create a new migration instead of editing it.`);
        }
        console.log(`Neon migration already applied: ${migrationName}`);
        continue;
      }

      await sql.begin(async (transaction) => {
        await transaction.unsafe(sqlText);
        await transaction`
          INSERT INTO schema_migrations (name, checksum)
          VALUES (${migrationName}, ${checksum})
        `;
      });

      console.log(`Neon migration applied: ${migrationName}`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('Neon migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
