-- V36__fix_peaq_coingecko_id.sql
-- CoinGecko API id for peaq (PEAQ) is "peaq-2", not "peaq".

UPDATE assets
SET crypto_coin_id = 'peaq-2'
WHERE lower(crypto_coin_id) = 'peaq';
