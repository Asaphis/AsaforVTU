-- Delayed account deletion preserves financial records while allowing personal-data anonymization.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'requested',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  blocked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT account_deletion_request_status CHECK (status IN ('requested', 'cancelled', 'processed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_account_deletion_request
  ON account_deletion_requests(user_id)
  WHERE status = 'requested';
CREATE INDEX IF NOT EXISTS idx_account_deletion_due
  ON account_deletion_requests(scheduled_for)
  WHERE status = 'requested';
CREATE INDEX IF NOT EXISTS idx_account_deletion_user
  ON account_deletion_requests(user_id, created_at DESC);

CREATE TRIGGER update_account_deletion_requests_updated_at
  BEFORE UPDATE ON account_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
