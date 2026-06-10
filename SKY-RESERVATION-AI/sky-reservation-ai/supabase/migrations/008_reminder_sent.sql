-- Track whether a 24h reminder email has been sent for each reservation
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_reservations_reminder
  ON reservations (tenant_id, start_time, reminder_sent)
  WHERE reminder_sent = false;
