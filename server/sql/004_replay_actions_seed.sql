CREATE TABLE IF NOT EXISTS match_replay_actions (
    match_id       UUID PRIMARY KEY REFERENCES matches(match_id) ON DELETE CASCADE,
    start_meta     JSONB NOT NULL,
    actions        JSONB NOT NULL,
    duration_ticks INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_replay_actions_created_at
    ON match_replay_actions(created_at DESC);
