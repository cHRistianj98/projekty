ALTER TABLE portfolio_transfers
    ADD COLUMN IF NOT EXISTS fx_currency VARCHAR(3),
    ADD COLUMN IF NOT EXISTS fx_market_rate NUMERIC(19,8),
    ADD COLUMN IF NOT EXISTS fx_effective_rate NUMERIC(19,8),
    ADD COLUMN IF NOT EXISTS fx_spread_loss NUMERIC(19,2),
    ADD COLUMN IF NOT EXISTS fx_spread_percent NUMERIC(12,4),
    ADD COLUMN IF NOT EXISTS fx_quote_timestamp TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS fx_quote_source VARCHAR(500),
    ADD COLUMN IF NOT EXISTS fx_quote_provider VARCHAR(40);

COMMENT ON COLUMN portfolio_transfers.fx_market_rate IS
    'PLN per unit of foreign currency used as the benchmark at booking time.';
COMMENT ON COLUMN portfolio_transfers.fx_effective_rate IS
    'Actual PLN per unit paid by the user (amount paid / acquired quantity).';
COMMENT ON COLUMN portfolio_transfers.fx_spread_loss IS
    'Irreversible PLN loss versus the saved market benchmark; already embedded in transfer amount.';
COMMENT ON COLUMN portfolio_transfers.fx_quote_timestamp IS
    'Provider timestamp of the market quote used to calculate the FX spread.';
