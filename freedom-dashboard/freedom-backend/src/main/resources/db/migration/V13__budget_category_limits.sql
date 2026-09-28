-- FREEDOM 9.0
-- Detailed Categories 2.0 for budget limits.
-- If V13 is already used in your project, rename this file to the next free Flyway number.

ALTER TABLE budget_limits
    ADD COLUMN IF NOT EXISTS category_id BIGINT;

ALTER TABLE budget_limits
    ALTER COLUMN category DROP NOT NULL;

ALTER TABLE budget_limits
    DROP CONSTRAINT IF EXISTS fk_budget_limits_category;

ALTER TABLE budget_limits
    ADD CONSTRAINT fk_budget_limits_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id);

CREATE INDEX IF NOT EXISTS idx_budget_limits_category_id
    ON budget_limits(category_id);
