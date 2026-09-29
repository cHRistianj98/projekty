ALTER TABLE goal_contributions DROP CONSTRAINT IF EXISTS goal_contributions_source_asset_id_fkey;
ALTER TABLE goal_contributions DROP CONSTRAINT IF EXISTS goal_contributions_target_asset_id_fkey;
ALTER TABLE goal_contributions ALTER COLUMN target_asset_id DROP NOT NULL;
ALTER TABLE goal_contributions ADD CONSTRAINT goal_contributions_source_asset_id_fkey
  FOREIGN KEY (source_asset_id) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE goal_contributions ADD CONSTRAINT goal_contributions_target_asset_id_fkey
  FOREIGN KEY (target_asset_id) REFERENCES assets(id) ON DELETE SET NULL;

UPDATE goal_contributions gc SET source_asset_id=sc.id
FROM assets old_cash JOIN assets sc ON sc.user_id=old_cash.user_id AND sc.system_cash=TRUE
WHERE gc.source_asset_id=old_cash.id AND old_cash.system_cash=FALSE AND LOWER(TRIM(old_cash.name))='gotówka';

UPDATE goal_contributions gc SET target_asset_id=sc.id
FROM assets old_cash JOIN assets sc ON sc.user_id=old_cash.user_id AND sc.system_cash=TRUE
WHERE gc.target_asset_id=old_cash.id AND old_cash.system_cash=FALSE AND LOWER(TRIM(old_cash.name))='gotówka';

UPDATE goal_allocations dst
SET amount=dst.amount+x.amount, updated_at=NOW()
FROM (
  SELECT src.goal_id, sc.id system_id, SUM(src.amount) amount
  FROM goal_allocations src
  JOIN assets old_cash ON old_cash.id=src.asset_id
  JOIN assets sc ON sc.user_id=old_cash.user_id AND sc.system_cash=TRUE
  WHERE old_cash.system_cash=FALSE AND LOWER(TRIM(old_cash.name))='gotówka'
    AND EXISTS(SELECT 1 FROM goal_allocations e WHERE e.goal_id=src.goal_id AND e.asset_id=sc.id)
  GROUP BY src.goal_id,sc.id
) x
WHERE dst.goal_id=x.goal_id AND dst.asset_id=x.system_id;

DELETE FROM goal_allocations src
USING assets old_cash, assets sc
WHERE src.asset_id=old_cash.id AND sc.user_id=old_cash.user_id AND sc.system_cash=TRUE
  AND old_cash.system_cash=FALSE AND LOWER(TRIM(old_cash.name))='gotówka'
  AND EXISTS(SELECT 1 FROM goal_allocations e WHERE e.goal_id=src.goal_id AND e.asset_id=sc.id);

UPDATE goal_allocations ga
SET asset_id=sc.id, asset_name_snapshot='Gotówka', updated_at=NOW()
FROM assets old_cash JOIN assets sc ON sc.user_id=old_cash.user_id AND sc.system_cash=TRUE
WHERE ga.asset_id=old_cash.id AND old_cash.system_cash=FALSE AND LOWER(TRIM(old_cash.name))='gotówka';

UPDATE assets sc SET value=sc.value+x.total_value
FROM (
  SELECT user_id,SUM(value) total_value FROM assets
  WHERE system_cash=FALSE AND LOWER(TRIM(name))='gotówka'
  GROUP BY user_id
) x
WHERE sc.user_id=x.user_id AND sc.system_cash=TRUE;

DELETE FROM assets WHERE system_cash=FALSE AND LOWER(TRIM(name))='gotówka';

CREATE TABLE IF NOT EXISTS goal_executions(
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  spent_amount NUMERIC(19,2) NOT NULL CHECK(spent_amount>=0),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(goal_id)
);
