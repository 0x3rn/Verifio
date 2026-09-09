DO $$ BEGIN
  CREATE TYPE proxy_extension_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE wallet_transaction_kind ADD VALUE IF NOT EXISTS 'proxy_extension_debit';
ALTER TYPE wallet_transaction_kind ADD VALUE IF NOT EXISTS 'proxy_extension_refund';

CREATE TABLE IF NOT EXISTS proxy_extensions (
  id TEXT PRIMARY KEY,
  proxy_order_id TEXT NOT NULL REFERENCES proxy_orders(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider_identifier TEXT NOT NULL,
  cost_cents BIGINT NOT NULL CHECK (cost_cents > 0),
  status proxy_extension_status NOT NULL DEFAULT 'pending',
  previous_expires_at TIMESTAMPTZ,
  new_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proxy_extensions_user_created_at_idx ON proxy_extensions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS proxy_extensions_order_idx ON proxy_extensions (proxy_order_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS proxy_extensions_pending_order_idx
  ON proxy_extensions (proxy_order_id)
  WHERE status = 'pending';
