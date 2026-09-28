ALTER TABLE assets
    ADD COLUMN icon_key VARCHAR(40);

UPDATE assets
SET icon_key = CASE category
    WHEN 'CASH' THEN 'landmark'
    WHEN 'STOCKS' THEN 'chart'
    WHEN 'CRYPTO' THEN 'bitcoin'
    WHEN 'REAL_ESTATE' THEN 'building'
    WHEN 'BUSINESS' THEN 'briefcase'
    WHEN 'VEHICLE' THEN 'car'
    ELSE 'circleDollar'
END
WHERE icon_key IS NULL;

ALTER TABLE assets
    ALTER COLUMN icon_key SET NOT NULL;
