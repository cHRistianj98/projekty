BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE id = 4) THEN
        RAISE EXCEPTION 'Cannot create admin@gmail.com: users.id=4 already exists';
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER('admin@gmail.com')) THEN
        RAISE EXCEPTION 'Cannot create user id=4: email admin@gmail.com already exists';
    END IF;
END $$;

INSERT INTO users (
    id,
    email,
    password_hash,
    created_at
)
VALUES (
    4,
    'admin@gmail.com',
    '$2a$10$WH8YVVGSmZdWFadj0SE0/up9q7pVxMITd.bwjrA/y5ZMNTAZeFZcC',
    NOW()
);

-- Because id is inserted manually, keep the BIGSERIAL sequence ahead of existing IDs.
SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    GREATEST((SELECT MAX(id) FROM users), 1),
    TRUE
);

-- Direct SQL bypasses AuthService.register(), which normally calls
-- SystemCashService.ensureExists(). Create the same minimum system state here.
INSERT INTO portfolios (
    user_id,
    name,
    type,
    color,
    icon_key,
    system_portfolio,
    sort_order
)
SELECT
    4,
    'Główny',
    'MAIN',
    '#3b82f6',
    'wallet',
    TRUE,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM portfolios
    WHERE user_id = 4
      AND type = 'MAIN'
      AND system_portfolio = TRUE
);

INSERT INTO portfolios (
    user_id,
    name,
    type,
    color,
    icon_key,
    system_portfolio,
    sort_order
)
SELECT
    4,
    'Cele',
    'GOALS',
    '#8b5cf6',
    'target',
    TRUE,
    999
WHERE NOT EXISTS (
    SELECT 1
    FROM portfolios
    WHERE user_id = 4
      AND type = 'GOALS'
      AND system_portfolio = TRUE
);

INSERT INTO assets (
    user_id,
    name,
    value,
    color,
    category,
    icon_key,
    system_cash,
    portfolio_id
)
SELECT
    4,
    'Gotówka',
    0.00,
    '#3b82f6',
    'CASH',
    'wallet',
    TRUE,
    p.id
FROM portfolios p
WHERE p.user_id = 4
  AND p.type = 'MAIN'
  AND p.system_portfolio = TRUE
  AND NOT EXISTS (
      SELECT 1
      FROM assets a
      WHERE a.user_id = 4
        AND a.system_cash = TRUE
  );

COMMIT;

-- Sanity check
SELECT
    u.id,
    u.email,
    a.id AS system_cash_asset_id,
    a.name AS system_cash_name,
    a.value AS system_cash_value
FROM users u
LEFT JOIN assets a
    ON a.user_id = u.id
   AND a.system_cash = TRUE
WHERE u.id = 4;
