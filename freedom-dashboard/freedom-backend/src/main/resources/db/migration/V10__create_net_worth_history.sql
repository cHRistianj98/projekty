CREATE TABLE net_worth_history
(
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,

    month       VARCHAR(7) NOT NULL,
    value       NUMERIC(19, 2) NOT NULL,

    CONSTRAINT fk_net_worth_history_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_net_worth_history_user_month
        UNIQUE (user_id, month)
);

CREATE INDEX idx_net_worth_history_user_id
    ON net_worth_history(user_id);