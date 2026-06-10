-- Migration 007: Add role column to staff table
-- Adds a role field to allow distinguishing admin, staff, and viewer agents.

ALTER TABLE staff
  ADD COLUMN role text NOT NULL DEFAULT 'staff';

ALTER TABLE staff
  ADD CONSTRAINT staff_role_check
  CHECK (role IN ('admin', 'staff', 'viewer'));
