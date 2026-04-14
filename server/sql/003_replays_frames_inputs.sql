-- Соответствует diplom/Physical_Model_Description.md §5.1, §6
CREATE TABLE IF NOT EXISTS match_inputs (
    input_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id    UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    tick_number INTEGER NOT NULL,
    player_id   VARCHAR(50) NOT NULL,
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN (
        'forward', 'backward', 'turn_left', 'turn_right',
        'turret_left', 'turret_right', 'shoot'
    )),
    is_pressed  BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_inputs_match_tick ON match_inputs(match_id, tick_number);

CREATE TABLE IF NOT EXISTS replays (
    replay_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id           UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    title              VARCHAR(200) NOT NULL,
    is_public          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replays_match_id ON replays(match_id);
CREATE INDEX IF NOT EXISTS idx_replays_created_by ON replays(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_replays_is_public ON replays(is_public) WHERE is_public = TRUE;
