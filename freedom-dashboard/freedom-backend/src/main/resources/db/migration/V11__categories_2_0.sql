CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(16) NOT NULL,
    group_key VARCHAR(32) NOT NULL,
    slug VARCHAR(80) NOT NULL,
    name VARCHAR(120) NOT NULL,
    icon_key VARCHAR(80) NOT NULL,
    color VARCHAR(16) NOT NULL,
    system_default BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_categories_user_type_slug UNIQUE (user_id, type, slug),
    CONSTRAINT chk_categories_type CHECK (type IN ('EXPENSE', 'INCOME'))
);

CREATE INDEX idx_categories_user_type ON categories(user_id, type, active, sort_order);

ALTER TABLE transactions ADD COLUMN category_id BIGINT;
ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id) REFERENCES categories(id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);

-- Stare fixed/living/investment/goal zostają w kolumnie category.
-- Dzięki temu migracja jest bezpieczna, a Categories 2.0 może być wdrażane bez utraty danych.
