CREATE TABLE IF NOT EXISTS goal_portfolio_allocations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_goal_portfolio_allocation_goal UNIQUE (user_id, goal_id),
    CONSTRAINT uq_goal_portfolio_allocation_portfolio UNIQUE (user_id, portfolio_id)
);

CREATE INDEX IF NOT EXISTS idx_goal_portfolio_allocations_user
    ON goal_portfolio_allocations(user_id);

CREATE INDEX IF NOT EXISTS idx_goal_portfolio_allocations_goal
    ON goal_portfolio_allocations(user_id, goal_id);

CREATE INDEX IF NOT EXISTS idx_goal_portfolio_allocations_portfolio
    ON goal_portfolio_allocations(user_id, portfolio_id);

CREATE TABLE IF NOT EXISTS goal_completion_portfolio_snapshots (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    portfolio_id BIGINT REFERENCES portfolios(id) ON DELETE SET NULL,
    portfolio_name_snapshot VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_goal_completion_portfolio_snapshot UNIQUE (user_id, goal_id)
);
