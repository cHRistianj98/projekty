CREATE TABLE liability_portfolio_allocations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liability_id BIGINT NOT NULL REFERENCES liabilities(id) ON DELETE CASCADE,
    portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A dedicated debt portfolio belongs to one liability, and a liability can have
-- at most one dynamically linked portfolio. Manual asset allocations remain
-- independent and can still be used alongside the portfolio link.
CREATE UNIQUE INDEX ux_liability_portfolio_allocations_liability
    ON liability_portfolio_allocations(user_id, liability_id);

CREATE UNIQUE INDEX ux_liability_portfolio_allocations_portfolio
    ON liability_portfolio_allocations(user_id, portfolio_id);

CREATE INDEX ix_liability_portfolio_allocations_user
    ON liability_portfolio_allocations(user_id);
