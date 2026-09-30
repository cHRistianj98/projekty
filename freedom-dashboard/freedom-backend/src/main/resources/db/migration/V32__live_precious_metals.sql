ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS market_priced BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS metal_symbol VARCHAR(16),
    ADD COLUMN IF NOT EXISTS metal_quantity NUMERIC(19, 6),
    ADD COLUMN IF NOT EXISTS metal_unit VARCHAR(32),
    ADD COLUMN IF NOT EXISTS market_price_usd NUMERIC(19, 6),
    ADD COLUMN IF NOT EXISTS usd_pln_rate NUMERIC(19, 8),
    ADD COLUMN IF NOT EXISTS market_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_assets_market_priced
    ON assets(user_id, market_priced)
    WHERE market_priced = TRUE;

ALTER TABLE assets DROP CONSTRAINT IF EXISTS chk_assets_market_metal_fields;
ALTER TABLE assets
    ADD CONSTRAINT chk_assets_market_metal_fields CHECK (
        market_priced = FALSE
        OR (
            category = 'METALS'
            AND metal_symbol IN ('XAU', 'XAG')
            AND metal_quantity IS NOT NULL
            AND metal_quantity > 0
            AND metal_unit IN ('TROY_OUNCE', 'GRAM')
        )
    );
