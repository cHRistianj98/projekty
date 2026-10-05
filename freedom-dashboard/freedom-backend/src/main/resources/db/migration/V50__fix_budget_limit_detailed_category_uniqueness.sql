-- Categories 2.0 allows many detailed categories inside the same legacy group
-- (for example Groceries and Eating out both map to LIVING).
-- The original V8 uniqueness rule prevented that by allowing only one row per
-- (budget_plan_id, legacy category).

ALTER TABLE budget_limits
    DROP CONSTRAINT IF EXISTS uk_budget_limits_plan_category;

-- New Categories 2.0 rows: one limit per concrete category in a budget plan.
CREATE UNIQUE INDEX IF NOT EXISTS uk_budget_limits_plan_detailed_category
    ON budget_limits (budget_plan_id, category_id)
    WHERE category_id IS NOT NULL;

-- Backwards compatibility for old plans that still use only the legacy
-- FIXED/LIVING/INVESTMENT/GOAL category without category_id.
CREATE UNIQUE INDEX IF NOT EXISTS uk_budget_limits_plan_legacy_category
    ON budget_limits (budget_plan_id, category)
    WHERE category_id IS NULL AND category IS NOT NULL;
