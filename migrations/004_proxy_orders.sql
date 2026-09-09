DO $$ BEGIN
  CREATE TYPE proxy_order_status AS ENUM ('pending', 'active', 'failed', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE wallet_transaction_kind ADD VALUE IF NOT EXISTS 'proxy_debit';
ALTER TYPE wallet_transaction_kind ADD VALUE IF NOT EXISTS 'proxy_refund';

CREATE TABLE IF NOT EXISTS proxy_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider_identifier TEXT UNIQUE,
  package_id INTEGER NOT NULL CHECK (package_id > 0),
  package_name TEXT NOT NULL,
  bandwidth_gb NUMERIC(10, 2) NOT NULL CHECK (bandwidth_gb > 0),
  cost_cents BIGINT NOT NULL CHECK (cost_cents > 0),
  status proxy_order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS proxy_orders_user_created_at_idx ON proxy_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS proxy_orders_user_status_idx ON proxy_orders (user_id, status);
