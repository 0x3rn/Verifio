-- Only one paid upstream purchase may be in flight for an account at a time.
-- Leases expire automatically so an interrupted server never leaves a user stuck.
CREATE TABLE IF NOT EXISTS request_locks (
  lock_key TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS request_locks_expires_at_idx ON request_locks (expires_at);
