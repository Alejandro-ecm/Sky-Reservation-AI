-- ============================================================
-- SKY RESERVATION AI - Phase 3: Automations + Notifications
-- Migration: 003_automations
-- ============================================================

-- ============================================================
-- AUTOMATION RULES
-- ============================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  trigger           TEXT NOT NULL CHECK (trigger IN ('new_reservation', 'no_show', 'new_customer', 'follow_up_3day', 'missed_call')),
  action            TEXT NOT NULL CHECK (action IN ('send_whatsapp', 'n8n_webhook', 'send_email')),
  config            JSONB NOT NULL DEFAULT '{}',
  -- config keys depending on action:
  --   n8n_webhook:   { webhookUrl: string }
  --   send_whatsapp: { message: string, templateName?: string }
  --   send_email:    { emailSubject: string, emailBody: string }
  enabled           BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant ON automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(tenant_id, trigger);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(tenant_id, enabled);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('new_reservation', 'missed_call', 'new_customer', 'system')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  metadata   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(tenant_id, user_id, read) WHERE read = false;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Automation rules: only tenant members can see/manage
CREATE POLICY "Users can view automation rules in their tenant"
  ON automation_rules FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can manage automation rules"
  ON automation_rules FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'admin'));

-- Notifications: users see their own + tenant-wide (null user_id)
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id()
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete their notifications"
  ON notifications FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- TENANT SETTINGS: n8n_webhooks JSONB schema note
-- ============================================================
-- The tenants.settings JSONB column is extended to support:
-- {
--   "n8n_webhooks": {
--     "new_reservation": "https://n8n.example.com/webhook/...",
--     "no_show":          "https://n8n.example.com/webhook/...",
--     "new_customer":     "https://n8n.example.com/webhook/...",
--     "follow_up_3day":   "https://n8n.example.com/webhook/...",
--     "missed_call":      "https://n8n.example.com/webhook/..."
--   },
--   "hours": { ... },
--   "ai": { ... }
-- }
-- No schema change needed — tenants.settings is already JSONB.
