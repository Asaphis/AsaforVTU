CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  audience VARCHAR(30) NOT NULL DEFAULT 'all',
  destination TEXT,
  image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('push', 'email')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  destination TEXT,
  provider_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created_at
  ON notification_campaigns (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_campaign
  ON notification_deliveries (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user
  ON notification_deliveries (user_id, created_at DESC);
