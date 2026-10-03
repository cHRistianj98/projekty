-- System cash is an accounting buffer for imported/manual transactions whose
-- physical account is unknown. Give it a name that reflects that role.
UPDATE assets
SET name = 'Środki nierozdzielone'
WHERE system_cash = TRUE;
