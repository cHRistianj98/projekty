CREATE TABLE transactions
(
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,

    type                VARCHAR(20) NOT NULL,
    name                VARCHAR(255) NOT NULL,
    amount              NUMERIC(19, 2) NOT NULL,

    category            VARCHAR(50),

    recurring           BOOLEAN NOT NULL DEFAULT FALSE,
    transaction_date    DATE NOT NULL,

    recurring_rule_id   BIGINT,

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_transactions_amount
        CHECK (amount >= 0),

    CONSTRAINT chk_transactions_type
        CHECK (type IN ('INCOME', 'EXPENSE')),

    CONSTRAINT chk_transactions_category
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

CREATE INDEX idx_transactions_user_id
    ON transactions(user_id);

CREATE INDEX idx_transactions_user_date
    ON transactions(user_id, transaction_date);