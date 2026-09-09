import { createHash, randomUUID } from 'node:crypto';
import { getDb } from './neon';
import { formatPhoneNumber } from './smspool';
import type { ProxyOrder, RentalNumber, User, VerificationOrder } from './types';

type StoredUser = {
  id: string;
  username: string;
  email: string | null;
  balanceCents: string | number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type StoredPayment = {
  id: string;
  userId: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  amountCents: string | number;
  currency: string;
  status: string;
  createdAt: Date | string;
  completedAt: Date | string | null;
};

type StoredOrder = Omit<VerificationOrder, 'cost' | 'createdAt' | 'completedAt' | 'expiresAt'> & {
  costCents: string | number;
  createdAt: Date | string;
  completedAt: Date | string | null;
  expiresAt: Date | string;
};

type StoredRental = Omit<RentalNumber, 'cost' | 'startedAt' | 'expiresAt' | 'renewedAt'> & {
  costCents: string | number;
  startedAt: Date | string;
  expiresAt: Date | string;
  renewedAt: Date | string | null;
};

type StoredProxyOrder = Omit<ProxyOrder, 'cost' | 'createdAt' | 'expiresAt'> & {
  costCents: string | number;
  createdAt: Date | string;
  expiresAt: Date | string | null;
};

type StoredProxyExtension = {
  id: string;
  proxyOrderId: string;
  userId: string;
  providerIdentifier: string;
  costCents: string | number;
  status: 'pending' | 'completed' | 'failed';
  previousExpiresAt: Date | string | null;
  newExpiresAt: Date | string | null;
};

function centsToAmount(cents: string | number): number {
  return Number(cents) / 100;
}

function amountToCents(amount: number): number {
  if (!Number.isFinite(amount)) throw new Error('Amount must be a finite number.');
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents)) throw new Error('Amount is outside the supported range.');
  return cents;
}

function toISOString(value: Date | string): string {
  return new Date(value).toISOString();
}

function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email || undefined,
    balance: centsToAmount(user.balanceCents),
    createdAt: toISOString(user.createdAt),
    updatedAt: toISOString(user.updatedAt),
  };
}

function toOrder(order: StoredOrder): VerificationOrder {
  return {
    id: order.id,
    userId: order.userId,
    service: order.service,
    country: order.country,
    phoneNumber: formatPhoneNumber(order.phoneNumber, order.country),
    code: order.code || '',
    status: order.status,
    type: order.type,
    cost: centsToAmount(order.costCents),
    smspoolOrderId: order.smspoolOrderId,
    provider: order.provider,
    createdAt: toISOString(order.createdAt),
    completedAt: order.completedAt ? toISOString(order.completedAt) : null,
    expiresAt: toISOString(order.expiresAt),
  };
}

function toRental(rental: StoredRental): RentalNumber {
  return {
    id: rental.id,
    userId: rental.userId,
    phoneNumber: formatPhoneNumber(rental.phoneNumber, rental.country),
    country: rental.country,
    service: rental.service,
    status: rental.status,
    plan: rental.plan,
    cost: centsToAmount(rental.costCents),
    smspoolRentalId: rental.smspoolRentalId,
    startedAt: toISOString(rental.startedAt),
    expiresAt: toISOString(rental.expiresAt),
    renewedAt: rental.renewedAt ? toISOString(rental.renewedAt) : null,
  };
}

function toProxyOrder(order: StoredProxyOrder): ProxyOrder {
  return {
    id: order.id,
    userId: order.userId,
    providerIdentifier: order.providerIdentifier,
    packageId: order.packageId,
    packageName: order.packageName,
    bandwidthGb: Number(order.bandwidthGb),
    cost: centsToAmount(order.costCents),
    status: order.status,
    createdAt: toISOString(order.createdAt),
    expiresAt: order.expiresAt ? toISOString(order.expiresAt) : null,
  };
}

function toPayment(payment: StoredPayment) {
  return {
    id: payment.id,
    userId: payment.userId,
    providerOrderId: payment.providerOrderId,
    providerPaymentId: payment.providerPaymentId,
    amount: centsToAmount(payment.amountCents),
    currency: payment.currency,
    status: payment.status,
    createdAt: new Date(payment.createdAt),
    completedAt: payment.completedAt ? new Date(payment.completedAt) : null,
  };
}

function postgresConstraint(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { code?: unknown; constraint_name?: unknown; constraint?: unknown };
  if (candidate.code !== '23505') return undefined;
  return typeof candidate.constraint_name === 'string'
    ? candidate.constraint_name
    : typeof candidate.constraint === 'string'
      ? candidate.constraint
      : undefined;
}

export async function upsertUser(input: { id: string; username: string; email: string | null }): Promise<StoredUser> {
  const sql = getDb();
  const username = input.username.trim().toLowerCase();
  const email = input.email?.trim().toLowerCase() || null;

  try {
    const [user] = await sql<StoredUser[]>`
      INSERT INTO users (id, username, email)
      VALUES (${input.id}, ${username}, ${email})
      ON CONFLICT (id) DO UPDATE
      SET username = EXCLUDED.username, email = EXCLUDED.email, updated_at = NOW()
      RETURNING id, username, email, balance_cents AS "balanceCents", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    return user;
  } catch (error) {
    const constraint = postgresConstraint(error);
    if (constraint === 'users_username_key') throw new Error('USERNAME_TAKEN');
    if (constraint === 'users_email_key') throw new Error('EMAIL_TAKEN');
    throw error;
  }
}

/**
 * Enforces a fixed window in Neon, making rate limits consistent across local
 * development, serverless replicas, and horizontally scaled deployments.
 */
export async function consumeRateLimit(input: {
  scope: string;
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<boolean> {
  if (!Number.isInteger(input.limit) || input.limit < 1) throw new Error('Rate limit must be a positive integer.');
  if (!Number.isInteger(input.windowSeconds) || input.windowSeconds < 1) throw new Error('Rate limit window must be positive.');

  const bucket = createHash('sha256').update(`${input.scope}:${input.key}`).digest('hex');
  const [record] = await getDb()<{ requestCount: number }[]>`
    INSERT INTO request_rate_limits (bucket, window_started_at, request_count, updated_at)
    VALUES (${bucket}, NOW(), 1, NOW())
    ON CONFLICT (bucket) DO UPDATE
    SET
      request_count = CASE
        WHEN request_rate_limits.window_started_at <= NOW() - (${input.windowSeconds} * INTERVAL '1 second') THEN 1
        ELSE request_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN request_rate_limits.window_started_at <= NOW() - (${input.windowSeconds} * INTERVAL '1 second') THEN NOW()
        ELSE request_rate_limits.window_started_at
      END,
      updated_at = NOW()
    WHERE request_rate_limits.window_started_at <= NOW() - (${input.windowSeconds} * INTERVAL '1 second')
       OR request_rate_limits.request_count < ${input.limit}
    RETURNING request_count AS "requestCount"
  `;

  return Boolean(record);
}

export async function acquireRequestLock(input: { scope: string; key: string; leaseSeconds?: number }): Promise<boolean> {
  const leaseSeconds = input.leaseSeconds ?? 90;
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 1) throw new Error('Lock lease must be a positive integer.');

  const lockKey = createHash('sha256').update(`${input.scope}:${input.key}`).digest('hex');
  const [record] = await getDb()<{ lockKey: string }[]>`
    INSERT INTO request_locks (lock_key, expires_at, updated_at)
    VALUES (${lockKey}, NOW() + (${leaseSeconds} * INTERVAL '1 second'), NOW())
    ON CONFLICT (lock_key) DO UPDATE
    SET expires_at = NOW() + (${leaseSeconds} * INTERVAL '1 second'), updated_at = NOW()
    WHERE request_locks.expires_at <= NOW()
    RETURNING lock_key AS "lockKey"
  `;
  return Boolean(record);
}

export async function releaseRequestLock(input: { scope: string; key: string }): Promise<void> {
  const lockKey = createHash('sha256').update(`${input.scope}:${input.key}`).digest('hex');
  await getDb()`DELETE FROM request_locks WHERE lock_key = ${lockKey}`;
}

export async function getUserById(userId: string): Promise<StoredUser | undefined> {
  const [user] = await getDb()<StoredUser[]>`
    SELECT id, username, email, balance_cents AS "balanceCents", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM users
    WHERE id = ${userId}
  `;
  return user;
}

export async function countActiveOrders(userId: string): Promise<number> {
  const [result] = await getDb()<{ count: string | number }[]>`
    SELECT COUNT(*)::BIGINT AS count
    FROM verification_orders
    WHERE user_id = ${userId} AND status = 'waiting_for_code'
  `;
  return Number(result?.count || 0);
}

export async function createOrderWithDebit(order: Omit<VerificationOrder, 'phoneNumber'> & { phoneNumber: string }) {
  const sql = getDb();
  const costCents = amountToCents(order.cost);
  if (costCents <= 0) throw new Error('Order cost must be greater than zero.');

  await sql.begin(async (transaction) => {
    const [user] = await transaction<{ balanceCents: string | number }[]>`
      UPDATE users
      SET balance_cents = balance_cents - ${costCents}, updated_at = NOW()
      WHERE id = ${order.userId} AND balance_cents >= ${costCents}
      RETURNING balance_cents AS "balanceCents"
    `;
    if (!user) throw new Error('Insufficient balance. Please add funds to your wallet.');

    await transaction`
      INSERT INTO verification_orders (
        id, user_id, service, country, phone_number, code, status, type, cost_cents,
        smspool_order_id, provider, created_at, completed_at, expires_at
      ) VALUES (
        ${order.id}, ${order.userId}, ${order.service}, ${order.country}, ${order.phoneNumber},
        ${order.code || null}, ${order.status}, ${order.type}, ${costCents},
        ${order.smspoolOrderId}, ${order.provider}, ${new Date(order.createdAt)},
        ${order.completedAt ? new Date(order.completedAt) : null}, ${new Date(order.expiresAt)}
      )
    `;

    await transaction`
      INSERT INTO wallet_transactions (id, user_id, amount_cents, balance_after_cents, kind, reference_id, description)
      VALUES (${randomUUID()}, ${order.userId}, ${-costCents}, ${user.balanceCents}, 'verification_debit', ${order.id}, 'Verification order charge')
    `;
  });
}

export async function getOrder(orderId: string): Promise<VerificationOrder | undefined> {
  const [order] = await getDb()<StoredOrder[]>`
    SELECT id, user_id AS "userId", service, country, phone_number AS "phoneNumber", code, status, type,
      cost_cents AS "costCents", smspool_order_id AS "smspoolOrderId", provider,
      created_at AS "createdAt", completed_at AS "completedAt", expires_at AS "expiresAt"
    FROM verification_orders
    WHERE id = ${orderId}
  `;
  return order ? toOrder(order) : undefined;
}

export async function getUserOrders(userId: string): Promise<VerificationOrder[]> {
  const orders = await getDb()<StoredOrder[]>`
    SELECT id, user_id AS "userId", service, country, phone_number AS "phoneNumber", code, status, type,
      cost_cents AS "costCents", smspool_order_id AS "smspoolOrderId", provider,
      created_at AS "createdAt", completed_at AS "completedAt", expires_at AS "expiresAt"
    FROM verification_orders
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return orders.map(toOrder);
}

export async function updateOrder(orderId: string, updates: Partial<VerificationOrder>) {
  const sql = getDb();
  if (updates.status !== undefined) {
    await sql`UPDATE verification_orders SET status = ${updates.status}, updated_at = NOW() WHERE id = ${orderId}`;
  }
  if (updates.code !== undefined) {
    await sql`UPDATE verification_orders SET code = ${updates.code || null}, updated_at = NOW() WHERE id = ${orderId}`;
  }
  if (updates.completedAt !== undefined) {
    await sql`UPDATE verification_orders SET completed_at = ${updates.completedAt ? new Date(updates.completedAt) : null}, updated_at = NOW() WHERE id = ${orderId}`;
  }
  if (updates.expiresAt !== undefined) {
    await sql`UPDATE verification_orders SET expires_at = ${new Date(updates.expiresAt)}, updated_at = NOW() WHERE id = ${orderId}`;
  }
  return getOrder(orderId);
}

export async function completeOrder(orderId: string, code: string) {
  await getDb()`
    UPDATE verification_orders
    SET code = ${code}, status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = ${orderId} AND status = 'waiting_for_code'
  `;
}

export async function refundOrder(orderId: string, userId: string, status: 'refunded' | 'cancelled' = 'refunded') {
  const sql = getDb();
  return sql.begin(async (transaction) => {
    const [order] = await transaction<{ userId: string; costCents: string | number; status: VerificationOrder['status'] }[]>`
      SELECT user_id AS "userId", cost_cents AS "costCents", status
      FROM verification_orders
      WHERE id = ${orderId}
    `;
    if (!order || order.userId !== userId || order.status !== 'waiting_for_code') return false;

    const [updatedOrder] = await transaction<{ id: string }[]>`
      UPDATE verification_orders
      SET status = ${status}, completed_at = NOW(), updated_at = NOW()
      WHERE id = ${orderId} AND status = 'waiting_for_code'
      RETURNING id
    `;
    if (!updatedOrder) return false;

    const [user] = await transaction<{ balanceCents: string | number }[]>`
      UPDATE users
      SET balance_cents = balance_cents + ${order.costCents}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING balance_cents AS "balanceCents"
    `;
    if (!user) throw new Error('USER_NOT_FOUND');

    await transaction`
      INSERT INTO wallet_transactions (id, user_id, amount_cents, balance_after_cents, kind, reference_id, description)
      VALUES (${randomUUID()}, ${userId}, ${order.costCents}, ${user.balanceCents}, 'order_refund', ${orderId}, 'Verification order refund')
    `;
    return true;
  });
}

export function generateOrderId() {
  return `order_${randomUUID()}`;
}

export async function createRentalWithDebit(rental: RentalNumber) {
  const sql = getDb();
  const costCents = amountToCents(rental.cost);
  if (costCents <= 0) throw new Error('Rental cost must be greater than zero.');

  await sql.begin(async (transaction) => {
    const [user] = await transaction<{ balanceCents: string | number }[]>`
      UPDATE users
      SET balance_cents = balance_cents - ${costCents}, updated_at = NOW()
      WHERE id = ${rental.userId} AND balance_cents >= ${costCents}
      RETURNING balance_cents AS "balanceCents"
    `;
    if (!user) throw new Error('Insufficient balance. Please add funds to your wallet.');

    await transaction`
      INSERT INTO rentals (
        id, user_id, phone_number, country, service, status, plan, cost_cents,
        smspool_rental_id, started_at, expires_at, renewed_at
      ) VALUES (
        ${rental.id}, ${rental.userId}, ${rental.phoneNumber}, ${rental.country}, ${rental.service},
        ${rental.status}, ${rental.plan}, ${costCents}, ${rental.smspoolRentalId},
        ${new Date(rental.startedAt)}, ${new Date(rental.expiresAt)}, ${rental.renewedAt ? new Date(rental.renewedAt) : null}
      )
    `;

    await transaction`
      INSERT INTO wallet_transactions (id, user_id, amount_cents, balance_after_cents, kind, reference_id, description)
      VALUES (${randomUUID()}, ${rental.userId}, ${-costCents}, ${user.balanceCents}, 'rental_debit', ${rental.id}, 'Rental charge')
    `;
  });
}

export async function getRental(rentalId: string): Promise<RentalNumber | undefined> {
  const [rental] = await getDb()<StoredRental[]>`
    SELECT id, user_id AS "userId", phone_number AS "phoneNumber", country, service, status, plan,
      cost_cents AS "costCents", smspool_rental_id AS "smspoolRentalId", started_at AS "startedAt",
      expires_at AS "expiresAt", renewed_at AS "renewedAt"
    FROM rentals
    WHERE id = ${rentalId}
  `;
  return rental ? toRental(rental) : undefined;
}

export async function getUserRentals(userId: string): Promise<RentalNumber[]> {
  const rentals = await getDb()<StoredRental[]>`
    SELECT id, user_id AS "userId", phone_number AS "phoneNumber", country, service, status, plan,
      cost_cents AS "costCents", smspool_rental_id AS "smspoolRentalId", started_at AS "startedAt",
      expires_at AS "expiresAt", renewed_at AS "renewedAt"
    FROM rentals
    WHERE user_id = ${userId}
    ORDER BY started_at DESC
  `;
  return rentals.map(toRental);
}

export async function updateRental(rentalId: string, updates: Partial<RentalNumber>) {
  const sql = getDb();
  if (updates.status !== undefined) {
    await sql`UPDATE rentals SET status = ${updates.status}, updated_at = NOW() WHERE id = ${rentalId}`;
  }
  if (updates.startedAt !== undefined) {
    await sql`UPDATE rentals SET started_at = ${new Date(updates.startedAt)}, updated_at = NOW() WHERE id = ${rentalId}`;
  }
  if (updates.expiresAt !== undefined) {
    await sql`UPDATE rentals SET expires_at = ${new Date(updates.expiresAt)}, updated_at = NOW() WHERE id = ${rentalId}`;
  }
  if (updates.renewedAt !== undefined) {
    await sql`UPDATE rentals SET renewed_at = ${updates.renewedAt ? new Date(updates.renewedAt) : null}, updated_at = NOW() WHERE id = ${rentalId}`;
  }
  return getRental(rentalId);
}

export function generateRentalId() {
  return `rental_${randomUUID()}`;
}

export function generateProxyOrderId() {
  return `proxy_${randomUUID()}`;
}

export function generateProxyExtensionId() {
  return `proxy_extension_${randomUUID()}`;
}

export async function createPendingProxyOrder(input: {
  id: string;
  userId: string;
  packageId: number;
  packageName: string;
  bandwidthGb: number;
  cost: number;
}): Promise<void> {
  const sql = getDb();
  const costCents = amountToCents(input.cost);
  if (costCents <= 0) throw new Error('Proxy package cost must be greater than zero.');
  if (!Number.isInteger(input.packageId) || input.packageId <= 0) throw new Error('Proxy package is invalid.');
  if (!Number.isFinite(input.bandwidthGb) || input.bandwidthGb <= 0) throw new Error('Proxy package bandwidth is invalid.');

  await sql.begin(async (transaction) => {
    const [user] = await transaction<{ balanceCents: string | number }[]>`
      UPDATE users
      SET balance_cents = balance_cents - ${costCents}, updated_at = NOW()
      WHERE id = ${input.userId} AND balance_cents >= ${costCents}
      RETURNING balance_cents AS "balanceCents"
    `;
    if (!user) throw new Error('Insufficient balance. Please add funds to your wallet.');

    await transaction`
      INSERT INTO proxy_orders (id, user_id, package_id, package_name, bandwidth_gb, cost_cents, status)
      VALUES (${input.id}, ${input.userId}, ${input.packageId}, ${input.packageName}, ${input.bandwidthGb}, ${costCents}, 'pending')
    `;

    await transaction`
      INSERT INTO wallet_transactions (id, user_id, amount_cents, balance_after_cents, kind, reference_id, description)
      VALUES (${randomUUID()}, ${input.userId}, ${-costCents}, ${user.balanceCents}, 'proxy_debit', ${input.id}, 'Proxy package charge')
    `;
  });
}

export async function finalizeProxyOrder(input: {
  id: string;
  userId: string;
  providerIdentifier: string;
  expiresAt: string | null;
}): Promise<ProxyOrder | undefined> {
  const [order] = await getDb()<StoredProxyOrder[]>`
    UPDATE proxy_orders
    SET provider_identifier = ${input.providerIdentifier}, status = 'active', expires_at = ${input.expiresAt ? new Date(input.expiresAt) : null}, updated_at = NOW()
    WHERE id = ${input.id} AND user_id = ${input.userId} AND status = 'pending'
    RETURNING id, user_id AS "userId", provider_identifier AS "providerIdentifier", package_id AS "packageId",
      package_name AS "packageName", bandwidth_gb AS "bandwidthGb", cost_cents AS "costCents", status,
      created_at AS "createdAt", expires_at AS "expiresAt"
  `;
  return order ? toProxyOrder(order) : undefined;
}

export async function failProxyOrderAndRefund(id: string, userId: string): Promise<boolean> {
  const sql = getDb();
  return sql.begin(async (transaction) => {
    const [order] = await transaction<{ userId: string; costCents: string | number }[]>`
      SELECT user_id AS "userId", cost_cents AS "costCents"
      FROM proxy_orders
      WHERE id = ${id} AND status = 'pending'
    `;
    if (!order || order.userId !== userId) return false;

    const [updated] = await transaction<{ id: string }[]>`
      UPDATE proxy_orders
      SET status = 'failed', updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId} AND status = 'pending'
      RETURNING id
    `;
    if (!updated) return false;

    const [user] = await transaction<{ balanceCents: string | number }[]>`
      UPDATE users
      SET balance_cents = balance_cents + ${order.costCents}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING balance_cents AS "balanceCents"
    `;
    if (!user) throw new Error('USER_NOT_FOUND');

    await transaction`
      INSERT INTO wallet_transactions (id, user_id, amount_cents, balance_after_cents, kind, reference_id, description)
      VALUES (${randomUUID()}, ${userId}, ${order.costCents}, ${user.balanceCents}, 'proxy_refund', ${id}, 'Proxy package refund')
    `;
    return true;
  });
}

export async function getUserProxyOrder(userId: string, orderId: string): Promise<ProxyOrder | undefined> {
  const [order] = await getDb()<StoredProxyOrder[]>`
    SELECT id, user_id AS "userId", provider_identifier AS "providerIdentifier", package_id AS "packageId",
      package_name AS "packageName", bandwidth_gb AS "bandwidthGb", cost_cents AS "costCents", status,
      created_at AS "createdAt", expires_at AS "expiresAt"
    FROM proxy_orders
    WHERE id = ${orderId} AND user_id = ${userId}
  `;
  return order ? toProxyOrder(order) : undefined;
}

export async function createPendingProxyExtension(input: {
  id: string;
  proxyOrderId: string;
  userId: string;
  providerIdentifier: string;
  cost: number;
  previousExpiresAt: string | null;
}): Promise<void> {
  const sql = getDb();
  const costCents = amountToCents(input.cost);
  if (costCents <= 0) throw new Error('Proxy extension cost must be greater than zero.');
  if (!input.providerIdentifier.trim()) throw new Error('Proxy identifier is required.');

  await sql.begin(async (transaction) => {
    const [order] = await transaction<StoredProxyOrder[]>`
      SELECT id, user_id AS "userId", provider_identifier AS "providerIdentifier", package_id AS "packageId",
        package_name AS "packageName", bandwidth_gb AS "bandwidthGb", cost_cents AS "costCents", status,
        created_at AS "createdAt", expires_at AS "expiresAt"
      FROM proxy_orders
      WHERE id = ${input.proxyOrderId}
        AND user_id = ${input.userId}
        AND provider_identifier = ${input.providerIdentifier}
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
      FOR UPDATE
    `;
    if (!order) throw new Error('That proxy is no longer available for extension.');

    const [user] = await transaction<{ balanceCents: string | number }[]>`
      UPDATE users
      SET balance_cents = balance_cents - ${costCents}, updated_at = NOW()
      WHERE id = ${input.userId} AND balance_cents >= ${costCents}
      RETURNING balance_cents AS "balanceCents"
    `;
    if (!user) throw new Error('Insufficient balance. Please add funds to your wallet.');

    await transaction`
      INSERT INTO proxy_extensions (
        id, proxy_order_id, user_id, provider_identifier, cost_cents, previous_expires_at
      )
      VALUES (
        ${input.id}, ${input.proxyOrderId}, ${input.userId}, ${input.providerIdentifier},
        ${costCents}, ${input.previousExpiresAt ? new Date(input.previousExpiresAt) : null}
      )
    `;

    await transaction`
      INSERT INTO wallet_transactions (id, user_id, amount_cents, balance_after_cents, kind, reference_id, description)
      VALUES (${randomUUID()}, ${input.userId}, ${-costCents}, ${user.balanceCents}, 'proxy_extension_debit', ${input.id}, 'Proxy extension charge')
    `;
  });
}

export async function finalizeProxyExtension(input: {
  id: string;
  userId: string;
  newExpiresAt: string;
}): Promise<ProxyOrder | undefined> {
  return getDb().begin(async (transaction) => {
    const [extension] = await transaction<StoredProxyExtension[]>`
      SELECT id, proxy_order_id AS "proxyOrderId", user_id AS "userId", provider_identifier AS "providerIdentifier",
        cost_cents AS "costCents", status, previous_expires_at AS "previousExpiresAt", new_expires_at AS "newExpiresAt"
      FROM proxy_extensions
      WHERE id = ${input.id} AND user_id = ${input.userId} AND status = 'pending'
      FOR UPDATE
    `;
    if (!extension) return undefined;

    const [order] = await transaction<StoredProxyOrder[]>`
      UPDATE proxy_orders
      SET expires_at = ${new Date(input.newExpiresAt)}, updated_at = NOW()
      WHERE id = ${extension.proxyOrderId}
        AND user_id = ${input.userId}
        AND provider_identifier = ${extension.providerIdentifier}
        AND status = 'active'
      RETURNING id, user_id AS "userId", provider_identifier AS "providerIdentifier", package_id AS "packageId",
        package_name AS "packageName", bandwidth_gb AS "bandwidthGb", cost_cents AS "costCents", status,
        created_at AS "createdAt", expires_at AS "expiresAt"
    `;
    if (!order) throw new Error('The local proxy record could not be updated.');

    await transaction`
      UPDATE proxy_extensions
      SET status = 'completed', new_expires_at = ${new Date(input.newExpiresAt)}, updated_at = NOW()
      WHERE id = ${input.id} AND user_id = ${input.userId} AND status = 'pending'
    `;
    return toProxyOrder(order);
  });
}

export async function failProxyExtensionAndRefund(id: string, userId: string): Promise<boolean> {
  const sql = getDb();
  return sql.begin(async (transaction) => {
    const [extension] = await transaction<StoredProxyExtension[]>`
      SELECT id, proxy_order_id AS "proxyOrderId", user_id AS "userId", provider_identifier AS "providerIdentifier",
        cost_cents AS "costCents", status, previous_expires_at AS "previousExpiresAt", new_expires_at AS "newExpiresAt"
      FROM proxy_extensions
      WHERE id = ${id} AND user_id = ${userId} AND status = 'pending'
      FOR UPDATE
    `;
    if (!extension) return false;

    await transaction`
      UPDATE proxy_extensions
      SET status = 'failed', updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId} AND status = 'pending'
    `;

    const [user] = await transaction<{ balanceCents: string | number }[]>`
      UPDATE users
      SET balance_cents = balance_cents + ${extension.costCents}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING balance_cents AS "balanceCents"
    `;
    if (!user) throw new Error('USER_NOT_FOUND');

    await transaction`
      INSERT INTO wallet_transactions (id, user_id, amount_cents, balance_after_cents, kind, reference_id, description)
      VALUES (${randomUUID()}, ${userId}, ${extension.costCents}, ${user.balanceCents}, 'proxy_extension_refund', ${id}, 'Proxy extension refund')
    `;
    return true;
  });
}

export async function getUserProxyOrders(userId: string): Promise<ProxyOrder[]> {
  const orders = await getDb()<StoredProxyOrder[]>`
    SELECT id, user_id AS "userId", provider_identifier AS "providerIdentifier", package_id AS "packageId",
      package_name AS "packageName", bandwidth_gb AS "bandwidthGb", cost_cents AS "costCents", status,
      created_at AS "createdAt", expires_at AS "expiresAt"
    FROM proxy_orders
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return orders.map(toProxyOrder);
}

export async function createPendingPayment(payment: Omit<StoredPayment, 'id' | 'createdAt' | 'completedAt' | 'amountCents'> & { amount: number }) {
  const sql = getDb();
  const id = randomUUID();
  const amountCents = amountToCents(payment.amount);
  if (amountCents <= 0) throw new Error('Payment amount must be greater than zero.');

  try {
    const [record] = await sql<StoredPayment[]>`
      INSERT INTO payments (id, user_id, provider_order_id, provider_payment_id, amount_cents, currency, status)
      VALUES (
        ${id}, ${payment.userId}, ${payment.providerOrderId}, ${payment.providerPaymentId},
        ${amountCents}, ${payment.currency}, ${payment.status}
      )
      RETURNING id, user_id AS "userId", provider_order_id AS "providerOrderId",
        provider_payment_id AS "providerPaymentId", amount_cents AS "amountCents", currency, status,
        created_at AS "createdAt", completed_at AS "completedAt"
    `;
    return toPayment(record);
  } catch (error) {
    if (postgresConstraint(error)) throw new Error('A payment with this provider reference already exists.');
    throw error;
  }
}

export async function getPaymentByProviderOrderId(providerOrderId: string) {
  const [payment] = await getDb()<StoredPayment[]>`
    SELECT id, user_id AS "userId", provider_order_id AS "providerOrderId", provider_payment_id AS "providerPaymentId",
      amount_cents AS "amountCents", currency, status, created_at AS "createdAt", completed_at AS "completedAt"
    FROM payments
    WHERE provider_order_id = ${providerOrderId}
  `;
  return payment ? toPayment(payment) : undefined;
}

export async function creditPaymentIfPending(providerOrderId: string, amount: number) {
  const sql = getDb();
  const amountCents = amountToCents(amount);

  return sql.begin(async (transaction) => {
    const [payment] = await transaction<StoredPayment[]>`
      SELECT id, user_id AS "userId", provider_order_id AS "providerOrderId", provider_payment_id AS "providerPaymentId",
        amount_cents AS "amountCents", currency, status, created_at AS "createdAt", completed_at AS "completedAt"
      FROM payments
      WHERE provider_order_id = ${providerOrderId}
    `;
    if (!payment) return 'not_found' as const;
    if (Number(payment.amountCents) !== amountCents) return 'amount_mismatch' as const;
    if (payment.status !== 'pending') return 'already_processed' as const;

    const [updatedPayment] = await transaction<{ id: string }[]>`
      UPDATE payments
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = ${payment.id} AND status = 'pending'
      RETURNING id
    `;
    if (!updatedPayment) return 'already_processed' as const;

    const [user] = await transaction<{ balanceCents: string | number }[]>`
      UPDATE users
      SET balance_cents = balance_cents + ${amountCents}, updated_at = NOW()
      WHERE id = ${payment.userId}
      RETURNING balance_cents AS "balanceCents"
    `;
    if (!user) return 'user_not_found' as const;

    await transaction`
      INSERT INTO wallet_transactions (id, user_id, amount_cents, balance_after_cents, kind, reference_id, description)
      VALUES (${randomUUID()}, ${payment.userId}, ${amountCents}, ${user.balanceCents}, 'payment_deposit', ${payment.id}, 'Cryptomus payment deposit')
    `;
    return 'credited' as const;
  });
}

export async function adjustUserBalance(userId: string, amount: number) {
  const sql = getDb();
  const amountCents = amountToCents(amount);
  if (amountCents === 0) throw new Error('Adjustment cannot be zero.');

  return sql.begin(async (transaction) => {
    const [user] = await transaction<{ balanceCents: string | number }[]>`
      UPDATE users
      SET balance_cents = balance_cents + ${amountCents}, updated_at = NOW()
      WHERE id = ${userId} AND balance_cents + ${amountCents} >= 0
      RETURNING balance_cents AS "balanceCents"
    `;
    if (!user) {
      const [existing] = await transaction<{ id: string }[]>`SELECT id FROM users WHERE id = ${userId}`;
      if (!existing) return undefined;
      throw new Error('INSUFFICIENT_BALANCE');
    }

    await transaction`
      INSERT INTO wallet_transactions (id, user_id, amount_cents, balance_after_cents, kind, description)
      VALUES (${randomUUID()}, ${userId}, ${amountCents}, ${user.balanceCents}, 'admin_adjustment', 'Administrator balance adjustment')
    `;
    return centsToAmount(user.balanceCents);
  });
}

export async function getAllUsers(): Promise<User[]> {
  const users = await getDb()<StoredUser[]>`
    SELECT id, username, email, balance_cents AS "balanceCents", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM users
    ORDER BY created_at DESC
  `;
  return users.map(toPublicUser);
}

export async function getSystemStats() {
  const sql = getDb();
  const [[users], [orders], [rentals]] = await Promise.all([
    sql<{ totalUsers: string | number; totalBalances: string | number }[]>`
      SELECT COUNT(*)::BIGINT AS "totalUsers", COALESCE(SUM(balance_cents), 0)::BIGINT AS "totalBalances" FROM users
    `,
    sql<{ count: string | number }[]>`SELECT COUNT(*)::BIGINT AS count FROM verification_orders WHERE status = 'waiting_for_code'`,
    sql<{ count: string | number }[]>`SELECT COUNT(*)::BIGINT AS count FROM rentals WHERE status = 'active'`,
  ]);
  return {
    totalUsers: Number(users?.totalUsers || 0),
    totalBalances: centsToAmount(users?.totalBalances || 0),
    activeOrders: Number(orders?.count || 0),
    activeRentals: Number(rentals?.count || 0),
  };
}

export async function getAllOrders() {
  const orders = await getDb()<(StoredOrder & { username: string })[]>`
    SELECT o.id, o.user_id AS "userId", o.service, o.country, o.phone_number AS "phoneNumber", o.code,
      o.status, o.type, o.cost_cents AS "costCents", o.smspool_order_id AS "smspoolOrderId", o.provider,
      o.created_at AS "createdAt", o.completed_at AS "completedAt", o.expires_at AS "expiresAt", u.username
    FROM verification_orders o
    INNER JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
    LIMIT 100
  `;
  return orders.map((order) => ({ ...toOrder(order), username: order.username }));
}
