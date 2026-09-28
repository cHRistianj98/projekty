CREATE TABLE liabilities
(
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,

    name                VARCHAR(255) NOT NULL,
    type                VARCHAR(50),

    original_amount     NUMERIC(19, 2) NOT NULL,
    remaining_amount    NUMERIC(19, 2) NOT NULL,

    monthly_payment     NUMERIC(19, 2) NOT NULL,

    principal_payment   NUMERIC(19, 2) NOT NULL,
    interest_payment    NUMERIC(19, 2) NOT NULL,

    interest_rate       NUMERIC(10, 4) NOT NULL,

    CONSTRAINT fk_liabilities_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_liabilities_original_amount
        CHECK (original_amount >= 0),

    CONSTRAINT chk_liabilities_remaining_amount
        CHECK (remaining_amount >= 0),

    CONSTRAINT chk_liabilities_monthly_payment
        CHECK (monthly_payment >= 0),

    CONSTRAINT chk_liabilities_principal_payment
        CHECK (principal_payment >= 0),

    CONSTRAINT chk_liabilities_interest_payment
        CHECK (interest_payment >= 0),

    CONSTRAINT chk_liabilities_interest_rate
        CHECK (interest_rate >= 0)
);

CREATE INDEX idx_liabilities_user_id
    ON liabilities(user_id);