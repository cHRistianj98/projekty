CREATE TABLE recurring_transactions
(
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,

    type            VARCHAR(20) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    amount          NUMERIC(19, 2) NOT NULL,

    category        VARCHAR(50),

    day_of_month    INTEGER NOT NULL,
    start_date      DATE NOT NULL,

    active          BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_recurring_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_recurring_transactions_type
        CHECK (type IN ('INCOME', 'EXPENSE')),

    CONSTRAINT chk_recurring_transactions_amount
        CHECK (amount >= 0),

    CONSTRAINT chk_recurring_transactions_day
        CHECK (
            day_of_month >= 1
            AND day_of_month <= 31
        ),

    CONSTRAINT chk_recurring_transactions_category
        CHECK (
            category IS NULL
            OR category IN (
                'FIXED',
                'LIVING',
                'INVESTMENT',
                'GOAL'
            )
        )
);

CREATE INDEX idx_recurring_transactions_user_id
    ON recurring_transactions(user_id);

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_recurring_rule
        FOREIGN KEY (recurring_rule_id)
        REFERENCES recurring_transactions(id)
        ON DELETE SET NULL;