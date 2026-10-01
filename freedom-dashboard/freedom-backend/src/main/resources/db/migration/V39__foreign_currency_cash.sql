ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS fx_priced BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS cash_currency VARCHAR(8),
    ADD COLUMN IF NOT EXISTS cash_quantity NUMERIC(38, 12),
    ADD COLUMN IF NOT EXISTS fx_rate_pln NUMERIC(19, 8),
    ADD COLUMN IF NOT EXISTS fx_effective_date DATE,
    ADD COLUMN IF NOT EXISTS fx_updated_at TIMESTAMPTZ;

ALTER TABLE assets
    DROP CONSTRAINT IF EXISTS chk_assets_fx_cash_fields;

ALTER TABLE assets
    ADD CONSTRAINT chk_assets_fx_cash_fields
    CHECK (
        fx_priced = FALSE
        OR (
            category = 'CASH'
            AND system_cash = FALSE
            AND cash_currency IN ('EUR', 'CHF', 'USD', 'CZK')
            AND cash_quantity IS NOT NULL
            AND cash_quantity > 0
            AND fx_rate_pln IS NOT NULL
            AND fx_rate_pln > 0
        )
    );

CREATE INDEX IF NOT EXISTS idx_assets_fx_priced
    ON assets(user_id, fx_priced)
    WHERE fx_priced = TRUE;
