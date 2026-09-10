import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required to check proxy data.');

  const sql = postgres(connectionString, { max: 1, connect_timeout: 15, prepare: false });
  try {
    const [summary] = await sql<{ proxy_orders: number; pending_orders: number; active_orders: number; extensions: number }[]>`
      SELECT
        (SELECT COUNT(*)::int FROM proxy_orders) AS proxy_orders,
        (SELECT COUNT(*)::int FROM proxy_orders WHERE status = 'pending') AS pending_orders,
        (SELECT COUNT(*)::int FROM proxy_orders WHERE status = 'active') AS active_orders,
        (SELECT COUNT(*)::int FROM proxy_extensions) AS extensions
    `;
    const [orphanedOrders] = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM proxy_orders AS orders
      LEFT JOIN users ON users.id = orders.user_id
      WHERE users.id IS NULL
    `;
    const [orphanedExtensions] = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM proxy_extensions AS extensions
      LEFT JOIN proxy_orders AS orders ON orders.id = extensions.proxy_order_id
      LEFT JOIN users ON users.id = extensions.user_id
      WHERE orders.id IS NULL OR users.id IS NULL
    `;
    const [activeWithoutProviderId] = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM proxy_orders
      WHERE status = 'active' AND provider_identifier IS NULL
    `;

    if (orphanedOrders.count !== 0 || orphanedExtensions.count !== 0 || activeWithoutProviderId.count !== 0) {
      throw new Error(`Proxy data integrity check failed: orphaned orders=${orphanedOrders.count}, orphaned extensions=${orphanedExtensions.count}, active orders without provider IDs=${activeWithoutProviderId.count}.`);
    }

    console.log(JSON.stringify({ ok: true, ...summary, orphanedOrders: 0, orphanedExtensions: 0, activeWithoutProviderId: 0 }));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('Proxy data check failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
