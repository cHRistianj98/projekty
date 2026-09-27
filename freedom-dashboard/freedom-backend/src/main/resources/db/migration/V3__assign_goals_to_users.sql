ALTER TABLE goals
    ADD COLUMN user_id BIGINT;

UPDATE goals
SET user_id = (
    SELECT id
    FROM users
    ORDER BY id
    LIMIT 1
)
WHERE user_id IS NULL;

ALTER TABLE goals
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE goals
    ADD CONSTRAINT fk_goals_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE;

CREATE INDEX idx_goals_user_id
    ON goals(user_id);