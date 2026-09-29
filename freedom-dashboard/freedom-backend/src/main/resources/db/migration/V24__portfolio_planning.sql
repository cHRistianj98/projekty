-- Portfolio targets are planning metadata; they do not move money.
ALTER TABLE portfolios
    ADD COLUMN target_amount NUMERIC(19,2),
    ADD COLUMN monthly_contribution NUMERIC(19,2) NOT NULL DEFAULT 0,
    ADD CONSTRAINT portfolios_target_positive CHECK (target_amount IS NULL OR target_amount > 0),
    ADD CONSTRAINT portfolios_contribution_nonnegative CHECK (monthly_contribution >= 0);
