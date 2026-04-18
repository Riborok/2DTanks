import type { Pool } from 'pg';
import type { TankConfig } from '../utils/types';

export type MatchParticipantInput = {
    userId: string | null;
    role: 'attacker' | 'defender' | 'fighter';
    tankConfig: TankConfig;
};

let matchParticipantsSchemaEnsured = false;

async function ensureMatchParticipantsSchema(pool: Pool): Promise<void> {
    if (matchParticipantsSchemaEnsured) {
        return;
    }
    await pool.query(
        `ALTER TABLE match_participants DROP CONSTRAINT IF EXISTS match_participants_role_check`
    );
    await pool.query(
        `ALTER TABLE match_participants
         ADD CONSTRAINT match_participants_role_check
         CHECK (role IN ('attacker', 'defender', 'spectator', 'fighter'))`
    );
    await pool.query(
        `INSERT INTO match_types (code, name, description) VALUES ('kill_time', 'Kill Time', 'Арена — режим на киллы за время')
         ON CONFLICT (code) DO NOTHING`
    );
    matchParticipantsSchemaEnsured = true;
}

export async function createMatchWithParticipants(
    pool: Pool,
    params: { roomCode: string; matchTypeCode?: string; players: MatchParticipantInput[] }
): Promise<string | null> {
    if (params.players.length === 0) {
        return null;
    }
    await ensureMatchParticipantsSchema(pool);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const matchTypeCode = params.matchTypeCode ?? 'standard';
        const typeRes = await client.query<{ match_type_id: string }>(
            `SELECT match_type_id FROM match_types WHERE code = $1 LIMIT 1`,
            [matchTypeCode]
        );
        if (typeRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }
        const matchTypeId = typeRes.rows[0].match_type_id;
        const matchRes = await client.query<{ match_id: string }>(
            `INSERT INTO matches (match_type_id, room_code, match_status, started_at)
             VALUES ($1, $2, 'in_progress', NOW())
             RETURNING match_id`,
            [matchTypeId, params.roomCode]
        );
        const matchId = matchRes.rows[0].match_id;

        for (const p of params.players) {
            const c = p.tankConfig;
            await client.query(
                `INSERT INTO match_participants (
                    match_id, user_id, role,
                    tank_color, tank_hull_num, tank_track_num, tank_turret_num, tank_weapon_num
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    matchId,
                    p.userId,
                    p.role,
                    String(c.color),
                    c.hullNum,
                    c.trackNum,
                    c.turretNum,
                    c.weaponNum
                ]
            );
        }

        await client.query('COMMIT');
        return matchId;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function finalizeMatch(
    pool: Pool,
    params: {
        matchId: string;
        status: 'completed' | 'aborted';
        /** Для стандарта / practice (1v1). Для арены оставить null и задать winnerUserIds. */
        winnerRole?: 'attacker' | 'defender' | null;
        /** Победители арены: UUID пользователей из match_participants.user_id */
        winnerUserIds?: string[] | null;
        endReason: string;
        durationTicks: number;
        matchStats?: unknown[] | null;
    }
): Promise<void> {
    await pool.query(
        `ALTER TABLE matches
         ADD COLUMN IF NOT EXISTS match_stats JSONB`
    );
    const winnerRole = params.winnerRole ?? null;
    await pool.query(
        `UPDATE matches SET
            match_status = $2,
            winner_role = $3,
            end_reason = $4,
            duration_ticks = $5,
            match_stats = COALESCE($6::jsonb, match_stats),
            ended_at = NOW(),
            updated_at = NOW()
         WHERE match_id = $1`,
        [
            params.matchId,
            params.status,
            winnerRole,
            params.endReason,
            params.durationTicks,
            params.matchStats ? JSON.stringify(params.matchStats) : null
        ]
    );
    const wu = params.winnerUserIds?.filter((id) => typeof id === 'string' && id.length > 0) ?? [];
    if (wu.length > 0) {
        await pool.query(
            `UPDATE match_participants SET is_winner = (user_id IS NOT NULL AND user_id = ANY($2::uuid[]))
             WHERE match_id = $1`,
            [params.matchId, wu]
        );
    } else if (winnerRole) {
        await pool.query(
            `UPDATE match_participants SET is_winner = (role = $2) WHERE match_id = $1`,
            [params.matchId, winnerRole]
        );
    } else {
        await pool.query(`UPDATE match_participants SET is_winner = FALSE WHERE match_id = $1`, [params.matchId]);
    }
}
