-- Do not allow historical audit fixtures to inflate production Push device
-- totals. This is intentionally non-destructive: the test account is retained
-- for audit history, but its devices can no longer receive customer campaigns.
UPDATE notification_devices AS d
SET is_active = FALSE,
    updated_at = CURRENT_TIMESTAMP
FROM users AS u
WHERE d.user_id = u.id
  AND d.is_active = TRUE
  AND (
    LOWER(COALESCE(u.email, '')) LIKE '%@example.invalid'
    OR LOWER(TRIM(COALESCE(u.full_name, ''))) = 'auth audit test'
  );
