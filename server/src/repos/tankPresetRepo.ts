import type { Pool } from 'pg';

export type TankPresetRow = {
    preset_id: string;
    name: string;
    tank_color: number;
    tank_hull_num: number;
    tank_track_num: number;
    tank_turret_num: number;
    tank_weapon_num: number;
    created_at: Date;
    updated_at: Date;
};

export type TankPresetInput = {
    name: string;
    color: number;
    hullNum: number;
    trackNum: number;
    turretNum: number;
    weaponNum: number;
};

export const MAX_PRESETS_PER_USER = 10;
export const PRESET_NAME_MAX_LEN = 40;

export async function listPresetsForUser(pool: Pool, userId: string): Promise<TankPresetRow[]> {
    const r = await pool.query<TankPresetRow>(
        `SELECT preset_id, name, tank_color, tank_hull_num, tank_track_num,
                tank_turret_num, tank_weapon_num, created_at, updated_at
         FROM user_tank_presets
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );
    return r.rows;
}

export async function countPresetsForUser(pool: Pool, userId: string): Promise<number> {
    const r = await pool.query<{ cnt: string }>(
        `SELECT COUNT(*)::text AS cnt FROM user_tank_presets WHERE user_id = $1`,
        [userId]
    );
    return Number(r.rows[0]?.cnt ?? 0);
}

export async function createPreset(
    pool: Pool,
    userId: string,
    input: TankPresetInput
): Promise<TankPresetRow> {
    const r = await pool.query<TankPresetRow>(
        `INSERT INTO user_tank_presets (
            user_id, name,
            tank_color, tank_hull_num, tank_track_num, tank_turret_num, tank_weapon_num
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING preset_id, name, tank_color, tank_hull_num, tank_track_num,
                   tank_turret_num, tank_weapon_num, created_at, updated_at`,
        [
            userId,
            input.name,
            input.color,
            input.hullNum,
            input.trackNum,
            input.turretNum,
            input.weaponNum
        ]
    );
    return r.rows[0];
}

export async function deletePreset(
    pool: Pool,
    userId: string,
    presetId: string
): Promise<boolean> {
    const r = await pool.query(
        `DELETE FROM user_tank_presets WHERE preset_id = $1 AND user_id = $2`,
        [presetId, userId]
    );
    return (r.rowCount ?? 0) > 0;
}

export async function updatePreset(
    pool: Pool,
    userId: string,
    presetId: string,
    input: TankPresetInput
): Promise<TankPresetRow | null> {
    const r = await pool.query<TankPresetRow>(
        `UPDATE user_tank_presets SET
            name = $3,
            tank_color = $4,
            tank_hull_num = $5,
            tank_track_num = $6,
            tank_turret_num = $7,
            tank_weapon_num = $8,
            updated_at = NOW()
         WHERE preset_id = $1 AND user_id = $2
         RETURNING preset_id, name, tank_color, tank_hull_num, tank_track_num,
                   tank_turret_num, tank_weapon_num, created_at, updated_at`,
        [
            presetId,
            userId,
            input.name,
            input.color,
            input.hullNum,
            input.trackNum,
            input.turretNum,
            input.weaponNum
        ]
    );
    return r.rows[0] ?? null;
}
