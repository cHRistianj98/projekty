ALTER TABLE portfolios
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS image_position VARCHAR(16) NOT NULL DEFAULT 'CENTER';

ALTER TABLE portfolios
    DROP CONSTRAINT IF EXISTS portfolios_image_position_check;

ALTER TABLE portfolios
    ADD CONSTRAINT portfolios_image_position_check
    CHECK (image_position IN ('TOP', 'CENTER', 'BOTTOM'));

-- Existing portfolios get a polished default illustration. These paths point to
-- files bundled with the React app under /public/portfolios.
UPDATE portfolios
SET image_url = CASE
    WHEN type = 'MAIN' THEN '/portfolios/main.webp'
    WHEN LOWER(name) LIKE '%długotermin%' OR LOWER(name) LIKE '%dlugotermin%' THEN '/portfolios/long-term.webp'
    WHEN LOWER(name) LIKE '%nadpłat%' OR LOWER(name) LIKE '%nadplat%' OR LOWER(name) LIKE '%kredyt%' THEN '/portfolios/debt-payoff.webp'
    WHEN LOWER(name) LIKE '%krótkotermin%' OR LOWER(name) LIKE '%krotkotermin%' THEN '/portfolios/short-term.webp'
    WHEN LOWER(name) LIKE '%poduszk%' OR LOWER(name) LIKE '%awaryj%' THEN '/portfolios/emergency-fund.webp'
    ELSE COALESCE(image_url, '/portfolios/long-term.webp')
END
WHERE type <> 'GOALS' AND (image_url IS NULL OR BTRIM(image_url) = '');
