-- Goal Spending / Goal Completion 1.0
-- A goal is a reservation of existing capital, not a separate wallet.
-- Expenses may consume a reservation without first transferring money to System Cash.

ALTER TABLE goals
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE goals
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

ALTER TABLE goals
    DROP CONSTRAINT IF EXISTS chk_goals_status;

ALTER TABLE goals
    ADD CONSTRAINT chk_goals_status
    CHECK (status IN ('ACTIVE', 'FUNDED', 'COMPLETED'));

-- Goals that were already fully funded before this migration become FUNDED.
UPDATE goals
SET status = CASE
    WHEN current_amount >= target_amount THEN 'FUNDED'
    ELSE 'ACTIVE'
END
WHERE status <> 'COMPLETED';

-- Backward compatibility for the old "execute goal" feature.
-- Those goals already had their allocated capital physically consumed.
UPDATE goals g
SET status = 'COMPLETED',
    completed_at = ge.executed_at,
    current_amount = GREATEST(g.current_amount, ge.spent_amount)
FROM goal_executions ge
WHERE ge.goal_id = g.id;

CREATE TABLE IF NOT EXISTS goal_spendings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    asset_name_snapshot VARCHAR(255) NOT NULL,
    amount NUMERIC(19,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (transaction_id)
);

CREATE INDEX IF NOT EXISTS ix_goal_spendings_user_goal
    ON goal_spendings(user_id, goal_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_goal_spendings_user_asset
    ON goal_spendings(user_id, asset_id);

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS goal_id BIGINT NULL;

ALTER TABLE transactions
    DROP CONSTRAINT IF EXISTS transactions_goal_id_fkey;

ALTER TABLE transactions
    ADD CONSTRAINT transactions_goal_id_fkey
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_transactions_goal_id
    ON transactions(goal_id);

CREATE TABLE IF NOT EXISTS goal_completion_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    mode VARCHAR(30) NOT NULL CHECK (mode IN ('RELEASE', 'TRANSFER_TO_GOAL')),
    target_goal_id BIGINT NULL REFERENCES goals(id) ON DELETE SET NULL,
    released_amount NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (released_amount >= 0),
    transferred_amount NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (transferred_amount >= 0),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (goal_id)
);
