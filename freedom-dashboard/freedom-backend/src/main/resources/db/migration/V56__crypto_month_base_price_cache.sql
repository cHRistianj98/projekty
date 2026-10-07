-- Persist the raw PLN unit price used as the ~30-day base for crypto performance.
-- This prevents every app restart / browser refresh from consuming CoinGecko
-- historical rate limit again for BTC, ETH, NOS, TRAC, etc.
CREATE TABLE IF NOT EXISTS crypto_month_base_prices (
    coin_id      VARCHAR(160) NOT NULL,
    base_date    DATE NOT NULL,
    price_pln    NUMERIC(38, 18) NOT NULL,
    fetched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_crypto_month_base_prices PRIMARY KEY (coin_id, base_date),
    CONSTRAINT ck_crypto_month_base_price_positive CHECK (price_pln > 0)
);

CREATE INDEX IF NOT EXISTS idx_crypto_month_base_prices_date
    ON crypto_month_base_prices(base_date);
