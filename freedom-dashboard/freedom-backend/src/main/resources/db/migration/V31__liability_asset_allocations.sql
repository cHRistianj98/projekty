CREATE TABLE liability_allocations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liability_id BIGINT NOT NULL REFERENCES liabilities(id) ON DELETE CASCADE,
    asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    asset_name_snapshot VARCHAR(255) NOT NULL,
    amount NUMERIC(19,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_liability_allocations_liability_asset
    ON liability_allocations(liability_id, asset_id)
    WHERE asset_id IS NOT NULL;

CREATE INDEX ix_liability_allocations_user_liability
    ON liability_allocations(user_id, liability_id);

CREATE INDEX ix_liability_allocations_user_asset
    ON liability_allocations(user_id, asset_id);
