ALTER TABLE goal_spendings
    ADD COLUMN IF NOT EXISTS reserved_consumed_amount NUMERIC(19,2) NOT NULL DEFAULT 0;

ALTER TABLE goal_spendings
    DROP CONSTRAINT IF EXISTS chk_goal_spendings_reserved_consumed_nonnegative;

ALTER TABLE goal_spendings
    ADD CONSTRAINT chk_goal_spendings_reserved_consumed_nonnegative
    CHECK (reserved_consumed_amount >= 0 AND reserved_consumed_amount <= amount);

UPDATE goal_spendings
SET reserved_consumed_amount = amount
WHERE reserved_consumed_amount IS NULL OR reserved_consumed_amount = 0;
