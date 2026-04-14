-- Соответствует diplom/Physical_Model_Description.md §3–4
CREATE TABLE IF NOT EXISTS match_types (
    match_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(50) NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    description   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
    match_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_type_id  UUID NOT NULL REFERENCES match_types(match_type_id) ON DELETE RESTRICT,
    season_id      UUID,
    room_code      VARCHAR(20),
    match_status   VARCHAR(20) NOT NULL CHECK (match_status IN ('waiting', 'in_progress', 'completed', 'aborted')),
    winner_role    VARCHAR(20) CHECK (winner_role IS NULL OR winner_role IN ('attacker', 'defender')),
    end_reason     VARCHAR(50),
    duration_ticks INTEGER,
    started_at     TIMESTAMPTZ,
    ended_at       TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_match_type_id ON matches(match_type_id);
CREATE INDEX IF NOT EXISTS idx_matches_season_id ON matches(season_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(match_status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);

CREATE TABLE IF NOT EXISTS match_participants (
    participant_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('attacker', 'defender', 'spectator')),
    tank_color      VARCHAR(20),
    tank_hull_num   SMALLINT,
    tank_track_num  SMALLINT,
    tank_turret_num SMALLINT,
    tank_weapon_num SMALLINT,
    kills_count     INTEGER NOT NULL DEFAULT 0 CHECK (kills_count >= 0),
    deaths_count    INTEGER NOT NULL DEFAULT 0 CHECK (deaths_count >= 0),
    is_winner       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user_id ON match_participants(user_id);

INSERT INTO match_types (code, name, description) VALUES
    ('standard', 'Стандартный', 'Режим сбора ключей и уничтожения базы'),
    ('kill_time', 'Kill Time', 'Режим на количество уничтожений за время')
ON CONFLICT (code) DO NOTHING;
