CREATE TABLE IF NOT EXISTS goal_spending_sources (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    asset_name_snapshot VARCHAR(255) NOT NULL,
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('EXPLICIT','PORTFOLIO_DYNAMIC','HISTORICAL_UNFUNDED')),
    amount NUMERIC(19,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_goal_spending_sources_transaction
    ON goal_spending_sources(user_id, transaction_id);

CREATE INDEX IF NOT EXISTS ix_goal_spending_sources_goal
    ON goal_spending_sources(user_id, goal_id);
