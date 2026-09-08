import postgres, { type Sql } from 'postgres';

type NeonGlobal = typeof globalThis & {
  __verifioSql?: Sql;
};

function createNeonClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('NEON_DATABASE_CONFIG_MISSING: Set DATABASE_URL to Neon\'s pooled connection string.');
  }

  return postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

/**
 * Server-only Neon client. Prepared statements are disabled because the runtime
 * URL intentionally uses Neon\'s PgBouncer transaction pooler.
 */
export function getDb(): Sql {
  const globalForNeon = globalThis as NeonGlobal;

  if (!globalForNeon.__verifioSql) {
    globalForNeon.__verifioSql = createNeonClient();
  }

  return globalForNeon.__verifioSql;
}
