CREATE TABLE goals
(
    id                   BIGSERIAL PRIMARY KEY,
    name                 VARCHAR(255) NOT NULL,
    current_amount       NUMERIC(19, 2) NOT NULL,
    target_amount        NUMERIC(19, 2) NOT NULL,
    monthly_contribution NUMERIC(19, 2) NOT NULL,
    target_date          DATE,
    priority             VARCHAR(50),
    type                 VARCHAR(50),
    color                VARCHAR(255) NOT NULL,
    image_url            TEXT,
    image_position       VARCHAR(50),

    CONSTRAINT chk_goals_current_amount
        CHECK (current_amount >= 0),

    CONSTRAINT chk_goals_target_amount
        CHECK (target_amount > 0),

    CONSTRAINT chk_goals_monthly_contribution
        CHECK (monthly_contribution >= 0)
);