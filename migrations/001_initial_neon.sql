DO $$ BEGIN
  CREATE TYPE verification_order_status AS ENUM ('pending', 'waiting_for_code', 'completed', 'expired', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_order_type AS ENUM ('sms', 'voice');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rental_status AS ENUM ('active', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rental_plan AS ENUM ('weekly', 'monthly', 'quarterly', 'biannual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wallet_transaction_kind AS ENUM ('verification_debit', 'rental_debit', 'order_refund', 'payment_deposit', 'admin_adjustment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username VARCHAR(32) NOT NULL,
  email TEXT NOT NULL,
  balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_username_key UNIQUE (username),
  CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS verification_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service TEXT NOT NULL,
  country TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  code TEXT,
  status verification_order_status NOT NULL,
  type verification_order_type NOT NULL,
  cost_cents BIGINT NOT NULL CHECK (cost_cents > 0),
  smspool_order_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'smspool',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS rentals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  phone_number TEXT NOT NULL,
  country TEXT NOT NULL,
  service TEXT NOT NULL,
  status rental_status NOT NULL,
  plan rental_plan NOT NULL,
  cost_cents BIGINT NOT NULL CHECK (cost_cents > 0),
  smspool_rental_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  renewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider_order_id TEXT NOT NULL,
  provider_payment_id TEXT,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT payments_provider_order_key UNIQUE (provider_order_id),
  CONSTRAINT payments_provider_payment_key UNIQUE (provider_payment_id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL CHECK (amount_cents <> 0),
  balance_after_cents BIGINT NOT NULL CHECK (balance_after_cents >= 0),
  kind wallet_transaction_kind NOT NULL,
  reference_id TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS verification_orders_user_created_at_idx ON verification_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS verification_orders_user_status_idx ON verification_orders (user_id, status);
CREATE INDEX IF NOT EXISTS rentals_user_started_at_idx ON rentals (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS rentals_user_status_idx ON rentals (user_id, status);
CREATE INDEX IF NOT EXISTS payments_user_created_at_idx ON payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_transactions_user_created_at_idx ON wallet_transactions (user_id, created_at DESC);
