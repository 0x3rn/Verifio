import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL is required.');
  if (!process.env.BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is required.');

  const sql = postgres(connectionString, { max: 1, connect_timeout: 15, prepare: false });
  try {
    const rows = await sql<{ tableName: string | null }[]>`
      SELECT table_name AS "tableName"
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('auth_users', 'auth_sessions', 'auth_accounts', 'auth_verifications')
      ORDER BY table_name
    `;
    const tables = rows.map((row) => row.tableName).filter((value): value is string => Boolean(value));
    const required = ['auth_accounts', 'auth_sessions', 'auth_users', 'auth_verifications'];
    const missing = required.filter((table) => !tables.includes(table));
    if (missing.length > 0) throw new Error(`Missing Better Auth tables: ${missing.join(', ')}`);
    console.log(`Better Auth configured and database schema verified: ${tables.join(', ')}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('Auth check failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
