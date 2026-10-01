-- V39__migrate_stock_symbols_to_yahoo.sql
--
-- Previous Freedom versions stored Stooq-style symbols.
-- The stock quote provider now uses Yahoo Finance symbols.

-- US: MMM.US -> MMM, KO.US -> KO, etc.
UPDATE assets
SET stock_symbol = regexp_replace(upper(stock_symbol), '\.US$', '')
WHERE stock_symbol IS NOT NULL
  AND upper(stock_symbol) ~ '\.US$';

-- Warsaw: old XTB-style / Stooq-style .PL -> Yahoo .WA
UPDATE assets
SET stock_symbol = regexp_replace(upper(stock_symbol), '\.PL$', '.WA')
WHERE stock_symbol IS NOT NULL
  AND upper(stock_symbol) ~ '\.PL$';

-- London: Stooq .UK -> Yahoo .L
UPDATE assets
SET stock_symbol = regexp_replace(upper(stock_symbol), '\.UK$', '.L')
WHERE stock_symbol IS NOT NULL
  AND upper(stock_symbol) ~ '\.UK$';

-- Bare GPW symbols used by Freedom presets.
UPDATE assets
SET stock_symbol = upper(stock_symbol) || '.WA'
WHERE upper(stock_symbol) IN (
    'DNP',
    'XTB',
    'ETFBM40TR',
    'ETFBS80TR',
    'ETFBW20TR'
);
