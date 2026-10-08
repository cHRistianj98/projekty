-- Net worth history used to store one value per YYYY-MM.
-- Keep the existing table/data, but widen the key so it can store a daily YYYY-MM-DD snapshot.
ALTER TABLE net_worth_history
    ALTER COLUMN month TYPE VARCHAR(10);

-- Preserve legacy monthly points as real calendar dates.
UPDATE net_worth_history
SET month = month || '-01'
WHERE char_length(month) = 7;
