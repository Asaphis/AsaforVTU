-- Complete PostgreSQL Schema for AsaforVTU
-- Replaces Firebase Authentication and Firestore

-- Users Table (replaces Firebase Auth users collection)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  username VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) DEFAULT 'user',
  pin_hash VARCHAR(255),
  referral_code VARCHAR(20) UNIQUE,
  referred_by VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  INDEX idx_users_email (email),
  INDEX idx_users_username (username),
  INDEX idx_users_referral_code (referral_code)
);

-- Wallets Table (replaces Firebase wallets collection)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  main_balance DECIMAL(15, 2) DEFAULT 0.00,
  cashback_balance DECIMAL(15, 2) DEFAULT 0.00,
  referral_balance DECIMAL(15, 2) DEFAULT 0.00,
  total_earned DECIMAL(15, 2) DEFAULT 0.00,
  total_spent DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id),
  INDEX idx_wallets_user_id (user_id)
);

-- Wallet Transactions Table (replaces Firebase wallet_transactions collection)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'credit', 'debit', 'cashback', 'referral'
  amount DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  description TEXT,
  reference VARCHAR(100) UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wallet_transactions_user_id (user_id),
  INDEX idx_wallet_transactions_type (type),
  INDEX idx_wallet_transactions_created_at (created_at)
);

-- Services Table (replaces Firebase services collection)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon TEXT,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_services_slug (slug),
  INDEX idx_services_category (category),
  INDEX idx_services_is_active (is_active)
);

-- Service Plans Table (replaces Firebase service_plans collection)
CREATE TABLE IF NOT EXISTS service_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  network VARCHAR(100) NOT NULL,
  network_key VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'data', 'airtime', 'cable', 'electricity', 'exam_pins'
  sub_type VARCHAR(50),
  price_user DECIMAL(15, 2) NOT NULL,
  price_api DECIMAL(15, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_service_plans_service_id (service_id),
  INDEX idx_service_plans_network (network),
  INDEX idx_service_plans_type (type),
  INDEX idx_service_plans_is_active (is_active)
);

-- Transactions Table (replaces Firebase transactions collection)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES service_plans(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'airtime', 'data', 'cable', 'electricity', 'exam_pins'
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'success', 'failed'
  reference VARCHAR(100) UNIQUE NOT NULL,
  provider_reference VARCHAR(100),
  phone VARCHAR(20),
  meter_number VARCHAR(50),
  smartcard_number VARCHAR(50),
  customer_name VARCHAR(255),
  customer_address TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transactions_user_id (user_id),
  INDEX idx_transactions_status (status),
  INDEX idx_transactions_type (type),
  INDEX idx_transactions_reference (reference),
  INDEX idx_transactions_created_at (created_at)
);

-- Payments Table (replaces Firebase payments collection)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'reversed'
  payment_method VARCHAR(50) NOT NULL, -- 'flutterwave', 'wallet', 'bank_transfer'
  provider VARCHAR(50) DEFAULT 'flutterwave',
  provider_reference VARCHAR(100) UNIQUE,
  tx_ref VARCHAR(100) UNIQUE,
  flw_ref VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payments_user_id (user_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_provider_reference (provider_reference),
  INDEX idx_payments_tx_ref (tx_ref)
);

-- Support Tickets Table (replaces Firebase support_tickets collection)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_support_tickets_user_id (user_id),
  INDEX idx_support_tickets_status (status),
  INDEX idx_support_tickets_created_at (created_at)
);

-- Support Messages Table (replaces Firebase support_messages collection)
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_support_messages_ticket_id (ticket_id),
  INDEX idx_support_messages_created_at (created_at)
);

-- Announcements Table (replaces Firebase announcements collection)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority VARCHAR(50) DEFAULT 'normal', -- 'info', 'warning', 'urgent'
  target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'users', 'admins'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  INDEX idx_announcements_is_active (is_active),
  INDEX idx_announcements_created_at (created_at)
);

-- Settings Table (replaces Firebase settings collection)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_settings_key (key)
);

-- Referrals Table (replaces Firebase referrals collection)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  reward_amount DECIMAL(15, 2) DEFAULT 0.00,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(referrer_id, referred_id),
  INDEX idx_referrals_referrer_id (referrer_id),
  INDEX idx_referrals_referred_id (referred_id),
  INDEX idx_referrals_referral_code (referral_code)
);

-- Notifications Table (replaces Firebase notifications collection)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'transaction', 'wallet', 'support', 'announcement'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_is_read (is_read),
  INDEX idx_notifications_created_at (created_at)
);

-- Admin Audit Log Table (replaces Firebase admin_audit collection)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- 'user', 'wallet', 'transaction', 'service', 'settings'
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_audit_log_admin_id (admin_id),
  INDEX idx_admin_audit_log_action (action),
  INDEX idx_admin_audit_log_created_at (created_at)
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_reset_tokens_user_id (user_id),
  INDEX idx_password_reset_tokens_token (token),
  INDEX idx_password_reset_tokens_expires_at (expires_at)
);

-- Email Verification Tokens Table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_verification_tokens_user_id (user_id),
  INDEX idx_email_verification_tokens_token (token),
  INDEX idx_email_verification_tokens_expires_at (expires_at)
);

-- Refresh Tokens Table (for JWT refresh tokens)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE,
  INDEX idx_refresh_tokens_user_id (user_id),
  INDEX idx_refresh_tokens_token (token),
  INDEX idx_refresh_tokens_expires_at (expires_at)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_plans_updated_at BEFORE UPDATE ON service_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('system_status', '{"status": "online", "message": "System is operational"}', 'System status and availability'),
  ('cashback_settings', '{"enabled": true, "percentage": 2.5}', 'Cashback configuration'),
  ('referral_settings', '{"enabled": true, "reward_amount": 50.00, "daily_budget": 1000.00}', 'Referral program settings'),
  ('airtime_networks', '{"MTN": {"enabled": true, "discount": 0}, "Airtel": {"enabled": true, "discount": 0}, "Glo": {"enabled": true, "discount": 0}, "9mobile": {"enabled": true, "discount": 0}}', 'Airtime network configuration'),
  ('announcements_enabled', 'true', 'Enable/disable announcements system')
ON CONFLICT (key) DO NOTHING;

-- Insert default services
INSERT INTO services (name, slug, icon, category, description, is_active, sort_order) VALUES
  ('Airtime', 'airtime', 'phone', 'Airtime & Data', 'Purchase airtime for all networks', true, 1),
  ('Data', 'data', 'wifi', 'Data Plans', 'Purchase data bundles for all networks', true, 2),
  ('Cable TV', 'cable', 'tv', 'Cable TV', 'Subscribe to DStv, GOtv, and StarTimes', true, 3),
  ('Electricity', 'electricity', 'zap', 'Electricity', 'Pay electricity bills for all providers', true, 4),
  ('Exam PINs', 'exam-pins', 'book', 'Exam PINs', 'Purchase WAEC, NECO, and JAMB exam pins', true, 5)
ON CONFLICT (slug) DO NOTHING;
