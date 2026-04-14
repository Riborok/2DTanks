import type { Pool } from 'pg';
import type { TankConfig } from '../utils/types';

export type MatchParticipantInput = {
    userId: string | null;
    role: 'attacker' | 'defender';
    tankConfig: TankConfig;
};

export async function createMatchWithParticipants(
    pool: Pool,
    params: { roomCode: string; players: MatchParticipantInput[] }
): Promise<string | null> {
    if (params.players.length === 0) {
        return null;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const typeRes = await client.query<{ match_type_id: string }>(
            `SELECT match_type_id FROM match_types WHERE code = $1 LIMIT 1`,
            ['standard']
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
        winnerRole: 'attacker' | 'defender';
        endReason: string;
        durationTicks: number;
    }
): Promise<void> {
    await pool.query(
        `UPDATE matches SET
            match_status = $2,
            winner_role = $3,
            end_reason = $4,
            duration_ticks = $5,
            ended_at = NOW(),
            updated_at = NOW()
         WHERE match_id = $1`,
        [params.matchId, params.status, params.winnerRole, params.endReason, params.durationTicks]
    );
    await pool.query(
        `UPDATE match_participants SET is_winner = (role = $2) WHERE match_id = $1`,
        [params.matchId, params.winnerRole]
    );
}
