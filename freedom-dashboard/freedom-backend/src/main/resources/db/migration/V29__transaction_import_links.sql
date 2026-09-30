CREATE TABLE transaction_import_links (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(40) NOT NULL,
    external_id VARCHAR(160) NOT NULL,
    transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    source_created_at TIMESTAMPTZ NULL,
    source_modified_at TIMESTAMPTZ NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_transaction_import_source UNIQUE (user_id, source, external_id)
);

CREATE INDEX ix_transaction_import_links_transaction
    ON transaction_import_links(transaction_id);

CREATE INDEX ix_transaction_import_links_user_source
    ON transaction_import_links(user_id, source);

-- Compatibility with the one-off V26 SQL import generated earlier.
-- If that migration was already used, reuse its external_id values so the
-- first import through the UI recognizes those rows as existing transactions.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'transactions'
          AND column_name = 'external_id'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'transactions'
          AND column_name = 'import_source'
    ) THEN
        EXECUTE $sql$
            INSERT INTO transaction_import_links(user_id, source, external_id, transaction_id)
            SELECT user_id, 'MYFINANCE', external_id, id
            FROM transactions
            WHERE external_id IS NOT NULL
              AND (import_source IS NULL OR import_source LIKE 'MMBACKUP_%')
            ON CONFLICT (user_id, source, external_id) DO NOTHING
        $sql$;
    END IF;
END $$;
