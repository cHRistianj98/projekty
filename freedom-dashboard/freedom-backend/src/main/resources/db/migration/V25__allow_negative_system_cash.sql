-- System cash is an accounting balance, not a normal manually managed asset.
-- Reversing or correcting an old income can legitimately push this balance below zero
-- when the money has already been transferred, allocated or spent.
-- Keep the non-negative invariant for every normal asset.
ALTER TABLE assets
    DROP CONSTRAINT IF EXISTS chk_assets_value;

ALTER TABLE assets
    ADD CONSTRAINT chk_assets_value
    CHECK (value >= 0 OR system_cash = TRUE);
