ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS real_estate_type VARCHAR(32),
    ADD COLUMN IF NOT EXISTS real_estate_city VARCHAR(120),
    ADD COLUMN IF NOT EXISTS real_estate_district VARCHAR(160),
    ADD COLUMN IF NOT EXISTS real_estate_area_sqm NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS real_estate_median_price_sqm NUMERIC(19, 2),
    ADD COLUMN IF NOT EXISTS real_estate_scope VARCHAR(32),
    ADD COLUMN IF NOT EXISTS real_estate_resolved_area VARCHAR(160),
    ADD COLUMN IF NOT EXISTS real_estate_record_count INTEGER,
    ADD COLUMN IF NOT EXISTS real_estate_period_from DATE,
    ADD COLUMN IF NOT EXISTS real_estate_period_to DATE,
    ADD COLUMN IF NOT EXISTS real_estate_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_assets_live_real_estate
    ON assets(user_id, market_priced, category)
    WHERE market_priced = TRUE AND category = 'REAL_ESTATE';

ALTER TABLE assets DROP CONSTRAINT IF EXISTS chk_assets_market_metal_fields;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS chk_assets_market_fields;
ALTER TABLE assets
    ADD CONSTRAINT chk_assets_market_fields CHECK (
        market_priced = FALSE
        OR (
            category = 'METALS'
            AND metal_symbol IN ('XAU', 'XAG')
            AND metal_quantity IS NOT NULL
            AND metal_quantity > 0
            AND metal_unit IN ('TROY_OUNCE', 'GRAM')
        )
        OR (
            category = 'REAL_ESTATE'
            AND real_estate_type = 'APARTMENT'
            AND real_estate_city IS NOT NULL
            AND length(trim(real_estate_city)) > 0
            AND real_estate_area_sqm IS NOT NULL
            AND real_estate_area_sqm > 0
        )
    );
