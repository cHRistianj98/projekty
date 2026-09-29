ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL;

UPDATE transactions t
SET asset_id = a.id
FROM assets a
WHERE t.user_id = a.user_id
  AND a.system_cash = TRUE
  AND t.asset_id IS NULL;

CREATE TABLE money_lots (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_type VARCHAR(40) NOT NULL,
    origin_transaction_id BIGINT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    origin_asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    original_amount NUMERIC(19,2) NOT NULL CHECK (original_amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_money_lots_user ON money_lots(user_id,id);
CREATE INDEX ix_money_lots_transaction ON money_lots(origin_transaction_id) WHERE origin_transaction_id IS NOT NULL;

CREATE TABLE money_positions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lot_id BIGINT NOT NULL REFERENCES money_lots(id) ON DELETE CASCADE,
    asset_id BIGINT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    amount NUMERIC(19,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(lot_id,asset_id)
);
CREATE INDEX ix_money_positions_asset ON money_positions(user_id,asset_id,id);

CREATE TABLE transaction_lot_usages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    lot_id BIGINT NOT NULL REFERENCES money_lots(id) ON DELETE CASCADE,
    asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    amount NUMERIC(19,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_transaction_lot_usages_transaction ON transaction_lot_usages(transaction_id);
CREATE INDEX ix_transaction_lot_usages_lot ON transaction_lot_usages(lot_id);

CREATE TABLE money_movements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lot_id BIGINT NULL REFERENCES money_lots(id) ON DELETE SET NULL,
    movement_type VARCHAR(40) NOT NULL,
    source_asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    target_asset_id BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
    transaction_id BIGINT NULL REFERENCES transactions(id) ON DELETE SET NULL,
    amount NUMERIC(19,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_money_movements_user_created ON money_movements(user_id,created_at DESC,id DESC);

-- Existing balances cannot be reconstructed perfectly from historical CRUD.
-- Seed one legacy lot per current asset. From this migration onward every flow
-- keeps its provenance when money moves between assets.
INSERT INTO money_lots(user_id,origin_type,origin_asset_id,original_amount,created_at)
SELECT user_id,'LEGACY_BALANCE',id,value,NOW()
FROM assets
WHERE value > 0;

INSERT INTO money_positions(user_id,lot_id,asset_id,amount)
SELECT l.user_id,l.id,l.origin_asset_id,l.original_amount
FROM money_lots l
WHERE l.origin_type='LEGACY_BALANCE'
  AND l.origin_asset_id IS NOT NULL;
