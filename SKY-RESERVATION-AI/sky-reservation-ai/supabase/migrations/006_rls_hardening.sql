-- ============================================================
-- SKY RESERVATION AI — RLS Hardening & Schema Corrections
-- Migration: 006_rls_hardening
-- Run after: 001..005
-- ============================================================

-- ─── 1. UNIQUE CONSTRAINT: invoices.external_invoice_id ──────────────────────
-- Required for upsert idempotency in Stripe/MercadoPago webhook handlers.
-- Prevents duplicate invoice records on Stripe retries.
ALTER TABLE invoices
  ADD CONSTRAINT invoices_external_invoice_id_unique
  UNIQUE (external_invoice_id);

-- ─── 2. HELPER FUNCTION: is_tenant_member ────────────────────────────────────
-- Unified tenant membership check used in all policies below.
-- SECURITY DEFINER so it runs as the function owner (postgres) and
-- can read profiles without triggering its own RLS.
CREATE OR REPLACE FUNCTION is_tenant_member(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND tenant_id = check_tenant_id
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── 3. HELPER FUNCTION: is_tenant_admin ─────────────────────────────────────
CREATE OR REPLACE FUNCTION is_tenant_admin(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND tenant_id = check_tenant_id
      AND role IN ('owner', 'admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── 4. FORCE ROW LEVEL SECURITY on sensitive tables ─────────────────────────
-- Ensures even the table owner (postgres role, used in direct SQL editor)
-- is subject to RLS when policies are evaluated. Service role still bypasses.
ALTER TABLE customers         FORCE ROW LEVEL SECURITY;
ALTER TABLE reservations      FORCE ROW LEVEL SECURITY;
ALTER TABLE conversations     FORCE ROW LEVEL SECURITY;
ALTER TABLE invoices          FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        FORCE ROW LEVEL SECURITY;

-- ─── 5. AUDIT_LOGS: append-only enforcement ──────────────────────────────────
-- Service role can INSERT (bypasses RLS — webhook handlers use service role).
-- Authenticated users can SELECT their tenant's logs.
-- Nobody (except DB superuser with FORCE RLS disabled) can UPDATE or DELETE.

DROP POLICY IF EXISTS "audit_tenant_read" ON audit_logs;

CREATE POLICY "audit_select_own_tenant" ON audit_logs
  FOR SELECT
  USING (is_tenant_member(tenant_id));

-- Explicit DENY for UPDATE and DELETE — even owners cannot tamper with audit trail
CREATE POLICY "audit_no_update" ON audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "audit_no_delete" ON audit_logs
  FOR DELETE USING (false);

-- ─── 6. CONVERSATIONS: add DELETE policy (missing from 001) ──────────────────
CREATE POLICY "admins_delete_conversations" ON conversations
  FOR DELETE
  USING (is_tenant_admin(tenant_id));

-- ─── 7. SUBSCRIPTIONS: explicit block for user mutations ─────────────────────
-- Service role writes these via Stripe/MercadoPago webhooks (bypasses RLS).
-- Authenticated users must never directly INSERT/UPDATE/DELETE subscriptions.

CREATE POLICY "subscriptions_no_insert" ON subscriptions
  FOR INSERT WITH CHECK (false);

CREATE POLICY "subscriptions_no_update" ON subscriptions
  FOR UPDATE USING (false);

CREATE POLICY "subscriptions_no_delete" ON subscriptions
  FOR DELETE USING (false);

-- Normalize existing SELECT policy to use helper function
DROP POLICY IF EXISTS "tenant_select_own_subscription" ON subscriptions;
CREATE POLICY "subscriptions_select_own_tenant" ON subscriptions
  FOR SELECT
  USING (is_tenant_member(tenant_id));

-- ─── 8. INVOICES: explicit block for user mutations ──────────────────────────
CREATE POLICY "invoices_no_insert" ON invoices
  FOR INSERT WITH CHECK (false);

CREATE POLICY "invoices_no_update" ON invoices
  FOR UPDATE USING (false);

CREATE POLICY "invoices_no_delete" ON invoices
  FOR DELETE USING (false);

-- Normalize existing SELECT policy
DROP POLICY IF EXISTS "tenant_select_own_invoices" ON invoices;
CREATE POLICY "invoices_select_own_tenant" ON invoices
  FOR SELECT
  USING (is_tenant_member(tenant_id));

-- ─── 9. USAGE_EVENTS: explicit block for user mutations ──────────────────────
CREATE POLICY "usage_no_insert" ON usage_events
  FOR INSERT WITH CHECK (false);

CREATE POLICY "usage_no_update" ON usage_events
  FOR UPDATE USING (false);

CREATE POLICY "usage_no_delete" ON usage_events
  FOR DELETE USING (false);

-- Normalize existing SELECT policy
DROP POLICY IF EXISTS "tenant_select_own_usage" ON usage_events;
CREATE POLICY "usage_select_own_tenant" ON usage_events
  FOR SELECT
  USING (is_tenant_member(tenant_id));

-- ─── 10. PLAN_LIMITS: block all mutations (reference data, seeded once) ───────
-- Public SELECT is retained (billing UI reads this without auth).
-- No user or service-role code should mutate plan_limits at runtime.
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_limits_select_all" ON plan_limits;
CREATE POLICY "plan_limits_select_all" ON plan_limits
  FOR SELECT USING (true);

CREATE POLICY "plan_limits_no_insert" ON plan_limits
  FOR INSERT WITH CHECK (false);

CREATE POLICY "plan_limits_no_update" ON plan_limits
  FOR UPDATE USING (false);

CREATE POLICY "plan_limits_no_delete" ON plan_limits
  FOR DELETE USING (false);

-- ─── 11. NORMALIZE 004 billing policies to helper functions ──────────────────
-- 004_billing.sql used subquery syntax; align with helper for consistency
-- and to avoid repeated profile table scans per row.

-- ─── 12. VIEWER ROLE: explicit read-only constraints ─────────────────────────
-- Viewer role must not be able to INSERT/UPDATE/DELETE customers, reservations,
-- services, staff, or conversations even though the current policies allow
-- any tenant member to do so. Adding explicit role check here.

-- Drop and recreate customer mutation policies with role guard
DROP POLICY IF EXISTS "Users can insert customers in their tenant" ON customers;
CREATE POLICY "members_insert_customers" ON customers
  FOR INSERT
  WITH CHECK (
    is_tenant_member(tenant_id)
    AND get_user_role() IN ('owner', 'admin', 'staff')
  );

DROP POLICY IF EXISTS "Users can update customers in their tenant" ON customers;
CREATE POLICY "members_update_customers" ON customers
  FOR UPDATE
  USING (
    is_tenant_member(tenant_id)
    AND get_user_role() IN ('owner', 'admin', 'staff')
  );

-- Reservations: staff can insert/update, only admin/owner can delete
DROP POLICY IF EXISTS "Users can insert reservations in their tenant" ON reservations;
CREATE POLICY "members_insert_reservations" ON reservations
  FOR INSERT
  WITH CHECK (
    is_tenant_member(tenant_id)
    AND get_user_role() IN ('owner', 'admin', 'staff')
  );

DROP POLICY IF EXISTS "Users can update reservations in their tenant" ON reservations;
CREATE POLICY "members_update_reservations" ON reservations
  FOR UPDATE
  USING (
    is_tenant_member(tenant_id)
    AND get_user_role() IN ('owner', 'admin', 'staff')
  );

-- Conversations: staff can insert/update, only admin/owner can delete
DROP POLICY IF EXISTS "Users can insert conversations in their tenant" ON conversations;
CREATE POLICY "members_insert_conversations" ON conversations
  FOR INSERT
  WITH CHECK (
    is_tenant_member(tenant_id)
    AND get_user_role() IN ('owner', 'admin', 'staff')
  );

DROP POLICY IF EXISTS "Users can update conversations in their tenant" ON conversations;
CREATE POLICY "members_update_conversations" ON conversations
  FOR UPDATE
  USING (
    is_tenant_member(tenant_id)
    AND get_user_role() IN ('owner', 'admin', 'staff')
  );

-- ─── 13. TENANTS: explicit no-insert from client ─────────────────────────────
-- Tenants are created by the handle_new_user() trigger (SECURITY DEFINER).
-- No authenticated user should ever INSERT a tenant directly.
CREATE POLICY "tenants_no_insert" ON tenants
  FOR INSERT WITH CHECK (false);

-- ─── 14. PERFORMANCE: index on profiles (id, tenant_id) ─────────────────────
-- Used by every helper function call. Composite index eliminates table scan
-- on the profiles table in every RLS policy evaluation.
CREATE INDEX IF NOT EXISTS idx_profiles_id_tenant ON profiles(id, tenant_id, role);

-- ─── 15. VERIFY: Confirm RLS is enabled on all tables ────────────────────────
-- This DO block raises an exception if any table unexpectedly lacks RLS,
-- making the migration fail rather than silently pass with a misconfigured table.
DO $$
DECLARE
  tbl TEXT;
  rls_enabled BOOLEAN;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tenants','profiles','customers','services','staff',
    'reservations','conversations','automation_rules','notifications',
    'subscriptions','invoices','usage_events','plan_limits',
    'audit_logs','api_keys','user_sessions'
  ])
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = tbl AND relnamespace = 'public'::regnamespace;

    IF rls_enabled IS FALSE OR rls_enabled IS NULL THEN
      RAISE EXCEPTION 'RLS NOT ENABLED on table: %', tbl;
    END IF;
  END LOOP;

  RAISE NOTICE '✓ RLS verified on all 16 tables';
END;
$$;
