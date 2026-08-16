ALTER TABLE email_verification_tokens
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_active
  ON email_verification_tokens(user_id, verified_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_last_sent_at
  ON email_verification_tokens(last_sent_at);

UPDATE email_verification_tokens
SET verified_at = CURRENT_TIMESTAMP
WHERE verified_at IS NULL
  AND expires_at <= CURRENT_TIMESTAMP;

UPDATE email_verification_tokens
SET attempts = 0
WHERE attempts IS NULL OR attempts < 0;
