ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS real_estate_valuation_mode VARCHAR(32),
    ADD COLUMN IF NOT EXISTS real_estate_market_segment VARCHAR(16),
    ADD COLUMN IF NOT EXISTS real_estate_purchase_price NUMERIC(19, 2),
    ADD COLUMN IF NOT EXISTS real_estate_purchase_date DATE,
    ADD COLUMN IF NOT EXISTS real_estate_estimated_price_sqm NUMERIC(19, 2),
    ADD COLUMN IF NOT EXISTS real_estate_anchor_median_price_sqm NUMERIC(19, 2),
    ADD COLUMN IF NOT EXISTS real_estate_quality_factor NUMERIC(19, 8),
    ADD COLUMN IF NOT EXISTS real_estate_anchor_resolved_area VARCHAR(160),
    ADD COLUMN IF NOT EXISTS real_estate_anchor_scope VARCHAR(32),
    ADD COLUMN IF NOT EXISTS real_estate_anchor_record_count INTEGER,
    ADD COLUMN IF NOT EXISTS real_estate_anchor_period_from DATE,
    ADD COLUMN IF NOT EXISTS real_estate_anchor_period_to DATE;

UPDATE assets
SET real_estate_valuation_mode = COALESCE(real_estate_valuation_mode, 'MARKET_MEDIAN'),
    real_estate_market_segment = COALESCE(real_estate_market_segment, 'ALL'),
    real_estate_estimated_price_sqm = COALESCE(real_estate_estimated_price_sqm, real_estate_median_price_sqm)
WHERE category = 'REAL_ESTATE'
  AND market_priced = TRUE;

ALTER TABLE assets DROP CONSTRAINT IF EXISTS chk_assets_real_estate_anchor_mode;
ALTER TABLE assets
    ADD CONSTRAINT chk_assets_real_estate_anchor_mode CHECK (
        real_estate_valuation_mode IS NULL
        OR real_estate_valuation_mode IN ('MARKET_MEDIAN', 'MARKET_ANCHORED')
    );

ALTER TABLE assets DROP CONSTRAINT IF EXISTS chk_assets_real_estate_market_segment;
ALTER TABLE assets
    ADD CONSTRAINT chk_assets_real_estate_market_segment CHECK (
        real_estate_market_segment IS NULL
        OR real_estate_market_segment IN ('ALL', 'PRIMARY', 'SECONDARY')
    );

ALTER TABLE assets DROP CONSTRAINT IF EXISTS chk_assets_real_estate_anchor_inputs;
ALTER TABLE assets
    ADD CONSTRAINT chk_assets_real_estate_anchor_inputs CHECK (
        real_estate_valuation_mode IS DISTINCT FROM 'MARKET_ANCHORED'
        OR (
            real_estate_purchase_price IS NOT NULL
            AND real_estate_purchase_price > 0
            AND real_estate_purchase_date IS NOT NULL
        )
    );
