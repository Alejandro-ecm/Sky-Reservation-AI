-- ============================================================
-- PHASE 2 ADDITIONS
-- ============================================================

-- Add columns to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS external_id TEXT; -- Vapi call ID or WhatsApp message ID

-- Add columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_reservations INTEGER DEFAULT 0;

-- Index for external_id lookups
CREATE INDEX IF NOT EXISTS conversations_external_id_idx ON conversations (external_id);

-- Index for customer phone lookups (ensure unique constraint exists)
CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_phone_idx
  ON customers (tenant_id, phone)
  WHERE phone IS NOT NULL;

-- ============================================================
-- FUNCTION: Update customer stats on reservation change
-- ============================================================

CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers SET
    total_reservations = (
      SELECT COUNT(*)
      FROM reservations
      WHERE customer_id = NEW.customer_id
        AND tenant_id = NEW.tenant_id
        AND status NOT IN ('cancelled')
    ),
    last_contact_at = NOW()
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_reservation_change ON reservations;

-- Create trigger
CREATE TRIGGER on_reservation_change
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- ============================================================
-- FUNCTION: Update last_contact_at on new conversation
-- ============================================================

CREATE OR REPLACE FUNCTION update_customer_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers SET
      last_contact_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_conversation_change ON conversations;

CREATE TRIGGER on_conversation_change
  AFTER INSERT OR UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_customer_last_contact();
