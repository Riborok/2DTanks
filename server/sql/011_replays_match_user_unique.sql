CREATE UNIQUE INDEX IF NOT EXISTS idx_replays_match_user_unique
ON replays (match_id, created_by_user_id)
WHERE created_by_user_id IS NOT NULL;
