-- V38__live_stocks_with_estimated_tax.sql

ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS stock_priced BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS stock_symbol VARCHAR(32),
    ADD COLUMN IF NOT EXISTS stock_currency VARCHAR(3),
    ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(38,12),
    ADD COLUMN IF NOT EXISTS stock_average_buy_price NUMERIC(38,12),
    ADD COLUMN IF NOT EXISTS stock_buy_fx_rate_pln NUMERIC(19,8),
    ADD COLUMN IF NOT EXISTS stock_current_price NUMERIC(38,12),
    ADD COLUMN IF NOT EXISTS stock_current_fx_rate_pln NUMERIC(19,8),
    ADD COLUMN IF NOT EXISTS stock_gross_value_pln NUMERIC(19,2),
    ADD COLUMN IF NOT EXISTS stock_cost_basis_pln NUMERIC(19,2),
    ADD COLUMN IF NOT EXISTS stock_unrealized_gain_pln NUMERIC(19,2),
    ADD COLUMN IF NOT EXISTS stock_tax_rate NUMERIC(7,4),
    ADD COLUMN IF NOT EXISTS stock_tax_amount_pln NUMERIC(19,2),
    ADD COLUMN IF NOT EXISTS stock_change_percent NUMERIC(18,8),
    ADD COLUMN IF NOT EXISTS stock_market_date DATE,
    ADD COLUMN IF NOT EXISTS stock_market_time VARCHAR(16),
    ADD COLUMN IF NOT EXISTS stock_updated_at TIMESTAMPTZ;

ALTER TABLE assets DROP CONSTRAINT IF EXISTS chk_assets_stock_fields;

ALTER TABLE assets
    ADD CONSTRAINT chk_assets_stock_fields
    CHECK (
        stock_priced = FALSE
        OR (
            category = 'STOCKS'
            AND stock_symbol IS NOT NULL
            AND stock_currency IS NOT NULL
            AND stock_quantity IS NOT NULL
            AND stock_quantity > 0
            AND stock_average_buy_price IS NOT NULL
            AND stock_average_buy_price > 0
        )
    );
