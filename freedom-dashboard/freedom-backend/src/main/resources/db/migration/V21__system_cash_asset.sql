ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS system_cash BOOLEAN NOT NULL DEFAULT FALSE;

-- Jeżeli user już ma aktywo dokładnie "Gotówka", zachowujemy jego wartość
-- i awansujemy najstarsze takie aktywo do roli systemowej.
WITH candidates AS (
    SELECT MIN(id) AS id
    FROM assets
    WHERE LOWER(TRIM(name)) = 'gotówka'
      AND category = 'CASH'
    GROUP BY user_id
)
UPDATE assets a
SET system_cash = TRUE,
    name = 'Gotówka',
    category = 'CASH',
    icon_key = COALESCE(NULLIF(icon_key, ''), 'wallet')
WHERE a.id IN (SELECT id FROM candidates);

-- Każdy istniejący user bez Gotówki dostaje ją z saldem 0.
INSERT INTO assets (
    user_id,
    name,
    value,
    color,
    category,
    icon_key,
    system_cash
)
SELECT
    u.id,
    'Gotówka',
    0.00,
    '#3b82f6',
    'CASH',
    'wallet',
    TRUE
FROM users u
WHERE NOT EXISTS (
    SELECT 1
    FROM assets a
    WHERE a.user_id = u.id
      AND a.system_cash = TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_assets_one_system_cash_per_user
    ON assets(user_id)
    WHERE system_cash = TRUE;
