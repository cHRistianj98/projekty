ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS fx_change_24h_percent NUMERIC(18, 8),
    ADD COLUMN IF NOT EXISTS fx_change_1m_percent NUMERIC(18, 8);

COMMENT ON COLUMN assets.fx_change_24h_percent IS
    'Percentage change of the foreign-currency PLN rate versus the previous market close / previous NBP fixing.';

COMMENT ON COLUMN assets.fx_change_1m_percent IS
    'Percentage change of the foreign-currency PLN rate versus approximately one calendar month earlier.';
