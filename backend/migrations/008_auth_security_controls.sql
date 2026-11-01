-- Persistent authentication controls for transaction PIN verification.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_pin_locked_until ON users(pin_locked_until);
