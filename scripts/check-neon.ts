import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required to check Neon.');

  const sql = postgres(connectionString, { max: 1, connect_timeout: 15, prepare: false });
  try {
    const [connection] = await sql<{ database: string; version: string }[]>`
      SELECT current_database() AS database, current_setting('server_version') AS version
    `;
    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'verification_orders', 'rentals', 'payments', 'wallet_transactions', 'request_rate_limits', 'request_locks')
      ORDER BY table_name
    `;
    console.log(`Neon connected: ${connection.database} (PostgreSQL ${connection.version})`);
    console.log(`Verified tables: ${tables.map((table) => table.table_name).join(', ') || 'none'}`);
    if (tables.length !== 7) throw new Error('Neon schema is incomplete. Run npm run db:migrate.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('Neon check failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
