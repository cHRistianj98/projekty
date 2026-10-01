-- V40__medical_properties_ticker_mpw_to_mpt.sql
-- Medical Properties Trust changed NYSE ticker MPW -> MPT effective 2026-02-02.

UPDATE assets
SET stock_symbol = 'MPT'
WHERE upper(stock_symbol) IN ('MPW', 'MPW.US');
