-- Пресеты («сеты») сборки танка, сохраняемые пользователем для быстрого выбора.
CREATE TABLE IF NOT EXISTS user_tank_presets (
    preset_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name            VARCHAR(40) NOT NULL,
    tank_color      SMALLINT NOT NULL CHECK (tank_color >= 0 AND tank_color <= 7),
    tank_hull_num   SMALLINT NOT NULL CHECK (tank_hull_num >= 0 AND tank_hull_num <= 15),
    tank_track_num  SMALLINT NOT NULL CHECK (tank_track_num >= 0 AND tank_track_num <= 15),
    tank_turret_num SMALLINT NOT NULL CHECK (tank_turret_num >= 0 AND tank_turret_num <= 15),
    tank_weapon_num SMALLINT NOT NULL CHECK (tank_weapon_num >= 0 AND tank_weapon_num <= 15),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tank_presets_user_id
    ON user_tank_presets(user_id, created_at DESC);
