CREATE TABLE goal_allocations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    asset_name_snapshot VARCHAR(255) NOT NULL,
    amount NUMERIC(19,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_goal_allocations_goal_asset
    ON goal_allocations(goal_id, asset_id)
    WHERE asset_id IS NOT NULL;

CREATE INDEX ix_goal_allocations_user_goal
    ON goal_allocations(user_id, goal_id);

CREATE TABLE goal_contributions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    amount NUMERIC(19,2) NOT NULL CHECK (amount > 0),
    mode VARCHAR(40) NOT NULL,
    source_asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    target_asset_id BIGINT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_goal_contributions_user_goal_created
    ON goal_contributions(user_id, goal_id, created_at DESC);

-- Backward compatibility:
-- dotychczasowe current_amount nie znika. Tworzymy jedną pozycję
-- "Legacy / nieprzypisane", dzięki czemu stary stan celu nadal się zgadza.
INSERT INTO goal_allocations (
    user_id,
    goal_id,
    asset_id,
    asset_name_snapshot,
    amount
)
SELECT
    g.user_id,
    g.id,
    NULL,
    'Legacy / nieprzypisane',
    g.current_amount
FROM goals g
WHERE g.current_amount > 0;
