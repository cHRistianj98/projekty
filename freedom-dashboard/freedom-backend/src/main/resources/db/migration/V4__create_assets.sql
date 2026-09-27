CREATE TABLE assets
(
    id       BIGSERIAL PRIMARY KEY,
    user_id  BIGINT NOT NULL,
    name     VARCHAR(255) NOT NULL,
    value    NUMERIC(19, 2) NOT NULL,
    color    VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,

    CONSTRAINT fk_assets_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_assets_value
        CHECK (value >= 0)
);

CREATE INDEX idx_assets_user_id
    ON assets(user_id);