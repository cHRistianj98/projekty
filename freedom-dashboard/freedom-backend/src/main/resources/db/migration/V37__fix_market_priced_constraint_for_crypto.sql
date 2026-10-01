-- V35__fix_market_priced_constraint_for_crypto.sql
--
-- market_priced started as a precious-metals feature, but is now also used
-- by crypto (and may be used by other automatically-valued asset types).
-- The old chk_assets_market_fields constraint incorrectly required metal
-- fields whenever market_priced = true.
--
-- Replace that generic constraint with type-specific consistency checks.

ALTER TABLE assets
    DROP CONSTRAINT IF EXISTS chk_assets_market_fields;

ALTER TABLE assets
    DROP CONSTRAINT IF EXISTS chk_assets_metal_fields;

ALTER TABLE assets
    ADD CONSTRAINT chk_assets_metal_fields
    CHECK (
        (
            metal_symbol IS NULL
            AND metal_quantity IS NULL
            AND metal_unit IS NULL
        )
        OR
        (
            metal_symbol IS NOT NULL
            AND metal_quantity IS NOT NULL
            AND metal_quantity > 0
            AND metal_unit IS NOT NULL
        )
    );

ALTER TABLE assets
    DROP CONSTRAINT IF EXISTS chk_assets_crypto_fields;

ALTER TABLE assets
    ADD CONSTRAINT chk_assets_crypto_fields
    CHECK (
        (
            crypto_coin_id IS NULL
            AND crypto_symbol IS NULL
            AND crypto_quantity IS NULL
        )
        OR
        (
            crypto_coin_id IS NOT NULL
            AND crypto_symbol IS NOT NULL
            AND crypto_quantity IS NOT NULL
            AND crypto_quantity > 0
        )
    );
