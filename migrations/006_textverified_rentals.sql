-- TextVerified rental metadata. Legacy SMSPool rows remain readable, while all
-- newly-created rentals use provider_rental_id and provider = 'textverified'.
ALTER TABLE rentals
  ALTER COLUMN smspool_rental_id DROP NOT NULL;

ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'smspool',
  ADD COLUMN IF NOT EXISTS provider_rental_id TEXT,
  ADD COLUMN IF NOT EXISTS service_scope TEXT NOT NULL DEFAULT 'specific',
  ADD COLUMN IF NOT EXISTS is_renewable BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS number_type TEXT NOT NULL DEFAULT 'mobile',
  ADD COLUMN IF NOT EXISTS capability TEXT NOT NULL DEFAULT 'sms',
  ADD COLUMN IF NOT EXISTS always_on BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS area_codes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS billing_cycle_id TEXT;

ALTER TABLE rentals
  ADD CONSTRAINT rentals_provider_check CHECK (provider IN ('smspool', 'textverified')),
  ADD CONSTRAINT rentals_service_scope_check CHECK (service_scope IN ('specific', 'all')),
  ADD CONSTRAINT rentals_capability_check CHECK (capability = 'sms');

CREATE INDEX IF NOT EXISTS rentals_provider_id_idx ON rentals (provider, provider_rental_id);
