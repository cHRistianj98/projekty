CREATE TABLE monthly_snapshots
(
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     BIGINT NOT NULL,

    month                       VARCHAR(7) NOT NULL,
    closed_at                   TIMESTAMP WITH TIME ZONE NOT NULL,

    income                      NUMERIC(19, 2) NOT NULL,
    expenses                    NUMERIC(19, 2) NOT NULL,
    surplus                     NUMERIC(19, 2) NOT NULL,
    savings_rate                NUMERIC(10, 4) NOT NULL,

    income_transactions         INTEGER NOT NULL,
    expense_transactions        INTEGER NOT NULL,

    net_worth                   NUMERIC(19, 2) NOT NULL,
    assets                      NUMERIC(19, 2) NOT NULL,
    liabilities                 NUMERIC(19, 2) NOT NULL,

    player_total_xp             INTEGER NOT NULL,
    player_level                INTEGER NOT NULL,
    player_level_name           VARCHAR(100) NOT NULL,
    unlocked_achievements       INTEGER NOT NULL,
    total_achievements          INTEGER NOT NULL,

    CONSTRAINT fk_monthly_snapshots_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_monthly_snapshots_user_month
        UNIQUE (user_id, month)
);

CREATE INDEX idx_monthly_snapshots_user_id
    ON monthly_snapshots(user_id);


CREATE TABLE monthly_snapshot_assets
(
    id                  BIGSERIAL PRIMARY KEY,
    snapshot_id         BIGINT NOT NULL,

    source_asset_id     BIGINT NOT NULL,

    name                VARCHAR(255) NOT NULL,
    value               NUMERIC(19, 2) NOT NULL,
    category            VARCHAR(50),

    CONSTRAINT fk_snapshot_assets_snapshot
        FOREIGN KEY (snapshot_id)
        REFERENCES monthly_snapshots(id)
        ON DELETE CASCADE
);


CREATE TABLE monthly_snapshot_goals
(
    id                      BIGSERIAL PRIMARY KEY,
    snapshot_id             BIGINT NOT NULL,

    source_goal_id          BIGINT NOT NULL,

    name                    VARCHAR(255) NOT NULL,
    current_amount          NUMERIC(19, 2) NOT NULL,
    target_amount           NUMERIC(19, 2) NOT NULL,
    monthly_contribution    NUMERIC(19, 2) NOT NULL,

    target_date             DATE,
    priority                VARCHAR(50),
    type                    VARCHAR(50),

    CONSTRAINT fk_snapshot_goals_snapshot
        FOREIGN KEY (snapshot_id)
        REFERENCES monthly_snapshots(id)
        ON DELETE CASCADE
);


CREATE TABLE monthly_snapshot_liabilities
(
    id                          BIGSERIAL PRIMARY KEY,
    snapshot_id                 BIGINT NOT NULL,

    source_liability_id         BIGINT NOT NULL,

    name                        VARCHAR(255) NOT NULL,
    type                        VARCHAR(50),

    original_amount             NUMERIC(19, 2) NOT NULL,
    remaining_amount            NUMERIC(19, 2) NOT NULL,

    monthly_payment             NUMERIC(19, 2) NOT NULL,
    principal_payment           NUMERIC(19, 2) NOT NULL,
    interest_payment            NUMERIC(19, 2) NOT NULL,

    interest_rate               NUMERIC(10, 4) NOT NULL,

    CONSTRAINT fk_snapshot_liabilities_snapshot
        FOREIGN KEY (snapshot_id)
        REFERENCES monthly_snapshots(id)
        ON DELETE CASCADE
);


CREATE INDEX idx_snapshot_assets_snapshot_id
    ON monthly_snapshot_assets(snapshot_id);

CREATE INDEX idx_snapshot_goals_snapshot_id
    ON monthly_snapshot_goals(snapshot_id);

CREATE INDEX idx_snapshot_liabilities_snapshot_id
    ON monthly_snapshot_liabilities(snapshot_id);