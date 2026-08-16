ALTER TABLE service_plans
  ADD COLUMN IF NOT EXISTS provider_cost DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS profit_amount DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS profit_margin_percent DECIMAL(7, 3),
  ADD COLUMN IF NOT EXISTS pricing_source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_plan_id VARCHAR(100);

UPDATE service_plans
SET provider_cost = COALESCE(provider_cost, price_api),
    profit_amount = COALESCE(profit_amount, price_user - price_api),
    profit_margin_percent = COALESCE(
      profit_margin_percent,
      CASE WHEN price_user > 0 THEN ((price_user - price_api) / price_user) * 100 ELSE 0 END
    ),
    pricing_source = COALESCE(pricing_source, 'legacy')
WHERE provider_cost IS NULL
   OR profit_amount IS NULL
   OR profit_margin_percent IS NULL
   OR pricing_source IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_plans_provider_plan_id
  ON service_plans(provider_plan_id);
