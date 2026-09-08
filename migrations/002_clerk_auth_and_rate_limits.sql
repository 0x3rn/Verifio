-- Clerk is the source of identity. Email is deliberately nullable because
-- Verifio supports username/password accounts without an email address.
ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL;

-- A durable, cross-instance sliding window for requests that can trigger a
-- paid provider action or create payment work. Bucket values are SHA-256
-- hashes, so raw client addresses are never stored in the database.
CREATE TABLE IF NOT EXISTS request_rate_limits (
  bucket TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS request_rate_limits_window_started_at_idx
  ON request_rate_limits (window_started_at);
