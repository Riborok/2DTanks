ALTER TABLE replays
ADD COLUMN IF NOT EXISTS shared_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_replays_shared_slug
ON replays (shared_slug)
WHERE shared_slug IS NOT NULL;
