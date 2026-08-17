ALTER TABLE notification_campaigns
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_due
  ON notification_campaigns (next_run_at)
  WHERE deleted_at IS NULL AND is_paused = FALSE AND status IN ('scheduled', 'recurring');

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status
  ON notification_campaigns (status, created_at DESC)
  WHERE deleted_at IS NULL;
