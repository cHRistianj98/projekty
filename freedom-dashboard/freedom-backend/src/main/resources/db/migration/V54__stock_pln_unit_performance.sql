ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS stock_change_24h_pln_percent NUMERIC(18,8),
    ADD COLUMN IF NOT EXISTS stock_change_1m_pln_percent NUMERIC(18,8);
