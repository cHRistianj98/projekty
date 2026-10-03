CREATE TABLE IF NOT EXISTS retail_bond_positions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id BIGINT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    emission_code VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    blocked_quantity INTEGER NOT NULL DEFAULT 0 CHECK (blocked_quantity >= 0),
    nominal_value NUMERIC(19,2) NOT NULL CHECK (nominal_value >= 0),
    current_gross_value NUMERIC(19,2) NOT NULL CHECK (current_gross_value >= 0),
    current_net_value NUMERIC(19,2) NOT NULL CHECK (current_net_value >= 0),
    taxable_gain NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (taxable_gain >= 0),
    tax_amount NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    purchase_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    valuation_date DATE NOT NULL,
    current_rate NUMERIC(7,4),
    current_period INTEGER,
    period_base_per_bond NUMERIC(19,6),
    source VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    market_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT retail_bond_positions_quantities CHECK (available_quantity + blocked_quantity <= quantity),
    CONSTRAINT ux_retail_bond_position UNIQUE (asset_id, emission_code, purchase_date)
);

CREATE INDEX IF NOT EXISTS ix_retail_bond_positions_user_asset
    ON retail_bond_positions(user_id, asset_id);
