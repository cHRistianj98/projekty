-- Repair budget limit uniqueness for Categories 2.0.
--
-- Older databases may still have the V8 constraint that allows only one
-- FIXED/LIVING/INVESTMENT/GOAL row per budget plan. Detailed categories keep
-- the legacy bucket in `category`, so e.g. housing-fees + loan both become
-- FIXED and collide even though they have different category_id values.
--
-- V50 introduced the intended indexes. This migration is deliberately
-- idempotent and re-applies the repair for databases where the old constraint
-- survived (for example a DB started from an older backend build).

ALTER TABLE budget_limits
    DROP CONSTRAINT IF EXISTS uk_budget_limits_plan_category;

CREATE UNIQUE INDEX IF NOT EXISTS uk_budget_limits_plan_detailed_category
    ON budget_limits (budget_plan_id, category_id)
    WHERE category_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_budget_limits_plan_legacy_category
    ON budget_limits (budget_plan_id, category)
    WHERE category_id IS NULL AND category IS NOT NULL;
