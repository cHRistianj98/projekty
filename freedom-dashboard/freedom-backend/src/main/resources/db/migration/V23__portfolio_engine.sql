CREATE TABLE portfolios (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('MAIN','GOALS','CUSTOM')),
    color VARCHAR(32) NOT NULL DEFAULT '#3b82f6',
    icon_key VARCHAR(40) NOT NULL DEFAULT 'wallet',
    system_portfolio BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX ux_portfolios_system_type ON portfolios(user_id,type) WHERE system_portfolio=TRUE;
CREATE INDEX ix_portfolios_user ON portfolios(user_id,sort_order,id);

INSERT INTO portfolios(user_id,name,type,color,icon_key,system_portfolio,sort_order)
SELECT id,'Główny','MAIN','#3b82f6','wallet',TRUE,0 FROM users;
INSERT INTO portfolios(user_id,name,type,color,icon_key,system_portfolio,sort_order)
SELECT id,'Cele','GOALS','#8b5cf6','target',TRUE,999 FROM users;

ALTER TABLE assets ADD COLUMN portfolio_id BIGINT;
UPDATE assets a SET portfolio_id=p.id FROM portfolios p
WHERE p.user_id=a.user_id AND p.type='MAIN' AND p.system_portfolio=TRUE;
ALTER TABLE assets ALTER COLUMN portfolio_id SET NOT NULL;
ALTER TABLE assets ADD CONSTRAINT assets_portfolio_id_fkey FOREIGN KEY(portfolio_id) REFERENCES portfolios(id) ON DELETE RESTRICT;
CREATE INDEX ix_assets_portfolio ON assets(portfolio_id);

CREATE TABLE asset_valuation_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    asset_name_snapshot VARCHAR(255) NOT NULL,
    previous_value NUMERIC(19,2) NOT NULL,
    new_value NUMERIC(19,2) NOT NULL,
    delta NUMERIC(19,2) NOT NULL,
    reason VARCHAR(40) NOT NULL DEFAULT 'MARKET_REVALUATION',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_asset_valuation_events_user_created ON asset_valuation_events(user_id,created_at DESC);

CREATE TABLE portfolio_transfers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    target_asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    source_name_snapshot VARCHAR(255) NOT NULL,
    target_name_snapshot VARCHAR(255) NOT NULL,
    amount NUMERIC(19,2) NOT NULL CHECK(amount>0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE goal_allocation_releases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    asset_name_snapshot VARCHAR(255) NOT NULL,
    amount NUMERIC(19,2) NOT NULL CHECK(amount>0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
