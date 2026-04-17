-- ============================================================
-- Voxaris Dashboard — Billing Migration
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- Safe to re-run (all statements use IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ─── 1. Add Stripe + billing fields to organizations ─────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id       text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id   text,
  ADD COLUMN IF NOT EXISTS stripe_overage_item_id   text,  -- metered subscription item ID
  ADD COLUMN IF NOT EXISTS billing_cycle_start      timestamptz,
  ADD COLUMN IF NOT EXISTS monthly_minute_limit     integer not null default 100;

-- Index for Stripe webhook lookups
CREATE INDEX IF NOT EXISTS organizations_stripe_customer_idx
  ON organizations (stripe_customer_id);

CREATE INDEX IF NOT EXISTS organizations_stripe_sub_idx
  ON organizations (stripe_subscription_id);

-- ─── 2. Seed minute limits based on existing plan values ─────
UPDATE organizations SET monthly_minute_limit = 100  WHERE plan = 'starter';
UPDATE organizations SET monthly_minute_limit = 400  WHERE plan = 'growth';
UPDATE organizations SET monthly_minute_limit = 1200 WHERE plan = 'enterprise';

-- ─── 3. Rename 'growth' plan to 'pro' ────────────────────────
-- (matches the Starter / Pro / Enterprise naming in UI)
-- Only run if you want the rename — comment out to keep 'growth'
-- UPDATE organizations SET plan = 'pro' WHERE plan = 'growth';
-- ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
-- ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check
--   CHECK (plan IN ('starter', 'pro', 'enterprise'));

-- ─── 4. billing_periods view (optional, for debugging) ───────
-- Shows each org's current period minutes, computed from interviews.
CREATE OR REPLACE VIEW org_billing_summary AS
SELECT
  o.id                                                AS org_id,
  o.name                                              AS org_name,
  o.plan,
  o.monthly_minute_limit,
  o.stripe_customer_id,
  o.stripe_subscription_id,
  o.billing_cycle_start,
  COUNT(i.id) FILTER (
    WHERE i.ended_at IS NOT NULL
      AND i.started_at >= COALESCE(
            o.billing_cycle_start,
            date_trunc('month', now())
          )
  )                                                   AS interviews_this_period,
  COALESCE(
    CEIL(
      SUM(
        EXTRACT(EPOCH FROM (i.ended_at - i.started_at))
      ) FILTER (
        WHERE i.ended_at IS NOT NULL
          AND i.started_at >= COALESCE(
                o.billing_cycle_start,
                date_trunc('month', now())
              )
      ) / 60.0
    ), 0
  )::integer                                          AS minutes_used,
  GREATEST(
    COALESCE(
      CEIL(
        SUM(
          EXTRACT(EPOCH FROM (i.ended_at - i.started_at))
        ) FILTER (
          WHERE i.ended_at IS NOT NULL
            AND i.started_at >= COALESCE(
                  o.billing_cycle_start,
                  date_trunc('month', now())
                )
        ) / 60.0
      ), 0
    )::integer - o.monthly_minute_limit, 0
  )                                                   AS overage_minutes
FROM organizations o
LEFT JOIN interviews i ON i.organization_id = o.id
GROUP BY o.id;
