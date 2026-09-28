CREATE TABLE budget_plans
(
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    month       VARCHAR(7) NOT NULL,

    CONSTRAINT fk_budget_plans_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_budget_plans_user_month
        UNIQUE (user_id, month)
);

CREATE TABLE budget_limits
(
    id              BIGSERIAL PRIMARY KEY,
    budget_plan_id  BIGINT NOT NULL,

    category        VARCHAR(50) NOT NULL,
    limit_amount    NUMERIC(19, 2) NOT NULL,

    CONSTRAINT fk_budget_limits_plan
        FOREIGN KEY (budget_plan_id)
        REFERENCES budget_plans(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_budget_limits_amount
        CHECK (limit_amount >= 0),

    CONSTRAINT chk_budget_limits_category
        CHECK (
            category IN (
                'FIXED',
                'LIVING',
                'INVESTMENT',
                'GOAL'
            )
        ),

    CONSTRAINT uk_budget_limits_plan_category
        UNIQUE (budget_plan_id, category)
);

CREATE INDEX idx_budget_plans_user_id
    ON budget_plans(user_id);