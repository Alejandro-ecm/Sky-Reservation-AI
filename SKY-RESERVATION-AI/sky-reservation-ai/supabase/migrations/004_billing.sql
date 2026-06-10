-- ============================================================
-- SKY RESERVATION AI - Billing & Multi-Tenant
-- Migration: 004_billing
-- ============================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  plan plan_type NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active', -- active | past_due | cancelled | trialing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  mercadopago_subscription_id TEXT,
  payment_provider TEXT NOT NULL DEFAULT 'stripe', -- 'stripe' | 'mercadopago'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- paid | pending | failed
  payment_provider TEXT NOT NULL,
  external_invoice_id TEXT,
  invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE plan_limits (
  plan plan_type PRIMARY KEY,
  conversations_per_month INTEGER NOT NULL,
  voice_minutes_per_month INTEGER NOT NULL,
  whatsapp_messages_per_month INTEGER NOT NULL,
  max_staff INTEGER NOT NULL,
  max_locations INTEGER NOT NULL,
  ai_model TEXT NOT NULL,
  has_api_access BOOLEAN DEFAULT false,
  has_advanced_analytics BOOLEAN DEFAULT false,
  has_automations BOOLEAN DEFAULT false,
  has_priority_support BOOLEAN DEFAULT false
);

-- Seed plan limits
INSERT INTO plan_limits VALUES
  ('starter', 100, 60, 200, 3, 1, 'gpt-4o-mini', false, false, false, false),
  ('pro', 1000, 600, 2000, 10, 3, 'gpt-4o-mini', false, true, true, false),
  ('enterprise', 999999, 99999, 999999, 999, 999, 'gpt-4o', true, true, true, true);

-- Usage tracking
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'conversation' | 'voice_minute' | 'whatsapp_message'
  quantity INTEGER NOT NULL DEFAULT 1,
  period_start TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_usage_tenant_period ON usage_events(tenant_id, period_start);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_own_subscription" ON subscriptions
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tenant_select_own_invoices" ON invoices
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tenant_select_own_usage" ON usage_events
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Plan limits are public (anyone can read)
CREATE POLICY "plan_limits_select_all" ON plan_limits
  FOR SELECT USING (true);

-- Updated_at trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
