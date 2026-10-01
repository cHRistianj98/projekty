ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS crypto_coin_id VARCHAR(120),
    ADD COLUMN IF NOT EXISTS crypto_symbol VARCHAR(32),
    ADD COLUMN IF NOT EXISTS crypto_quantity NUMERIC(38, 12),
    ADD COLUMN IF NOT EXISTS crypto_price_pln NUMERIC(38, 12),
    ADD COLUMN IF NOT EXISTS crypto_price_usd NUMERIC(38, 12),
    ADD COLUMN IF NOT EXISTS crypto_change_24h NUMERIC(18, 8),
    ADD COLUMN IF NOT EXISTS crypto_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_assets_user_crypto_live
    ON assets(user_id, crypto_coin_id)
    WHERE category = 'CRYPTO' AND market_priced = TRUE;
