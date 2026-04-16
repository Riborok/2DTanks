import type { Pool } from 'pg';
import type { TankConfig } from '../utils/types';

export type ReplayAction = {
    forward: boolean;
    backward: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    turretLeft: boolean;
    turretRight: boolean;
    shoot: boolean;
};

export type ReplayActionEvent = { tick: number; playerId: string; action: ReplayAction };

/** Снимок мира + вспомогательные поля для восстановления спавнера и таймеров бонусов. */
export type ReplayWorldInitEvent = {
    kind: 'world_init';
    tick: number;
    world: unknown;
    spawnOrigin: { x: number; y: number };
    aux?: { elapsedMs: number; ammoSpawnTimer: number; ammoSpawnInterval: number };
};

export type ReplayItemSpawnEvent = {
    kind: 'item_spawn';
    tick: number;
    id: number;
    x: number;
    y: number;
    type: number;
};

export type ReplayPlayerInputEvent = {
    kind: 'player_input';
    tick: number;
    playerId: string;
    action: ReplayAction;
};

export type ReplayEvent = ReplayWorldInitEvent | ReplayItemSpawnEvent | ReplayPlayerInputEvent;

export function isReplayPlayerInput(e: ReplayEvent): e is ReplayPlayerInputEvent {
    return e.kind === 'player_input';
}

export function replayEventsToActionRows(events: ReplayEvent[]): ReplayActionEvent[] {
    return events.filter(isReplayPlayerInput).map((e) => ({ tick: e.tick, playerId: e.playerId, action: e.action }));
}

export type ReplayStartMeta = {
    mode: 'standard';
    tickRate: number;
    attackerPlayerId: string;
    defenderPlayerId: string;
    attackerConfig: TankConfig;
    defenderConfig: TankConfig;
    rngSeed: number;
};

export type ReplayActionsRow = {
    startMeta: ReplayStartMeta;
    actions: ReplayActionEvent[];
    durationTicks: number | null;
    events: ReplayEvent[] | null;
};

async function ensureReplayActionsTable(pool: Pool): Promise<void> {
    await pool.query(
        `CREATE TABLE IF NOT EXISTS match_replay_actions (
            match_id       UUID PRIMARY KEY REFERENCES matches(match_id) ON DELETE CASCADE,
            start_meta     JSONB NOT NULL,
            actions        JSONB NOT NULL,
            duration_ticks INTEGER,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
    );
    await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_match_replay_actions_created_at
         ON match_replay_actions(created_at DESC)`
    );
    await pool.query(
        `ALTER TABLE match_replay_actions
         ADD COLUMN IF NOT EXISTS events JSONB`
    );
}

export async function saveMatchReplayActions(
    pool: Pool,
    matchId: string,
    payload: {
        startMeta: ReplayStartMeta;
        actions: ReplayActionEvent[];
        durationTicks: number;
        events?: ReplayEvent[] | null;
    }
): Promise<void> {
    await ensureReplayActionsTable(pool);
    const eventsJson =
        payload.events !== undefined && payload.events !== null ? JSON.stringify(payload.events) : null;
    await pool.query(
        `INSERT INTO match_replay_actions (match_id, start_meta, actions, duration_ticks, events)
         VALUES ($1, $2::jsonb, $3::jsonb, $4, $5::jsonb)
         ON CONFLICT (match_id) DO UPDATE SET
             start_meta = EXCLUDED.start_meta,
             actions = EXCLUDED.actions,
             duration_ticks = EXCLUDED.duration_ticks,
             events = EXCLUDED.events,
             created_at = NOW()`,
        [matchId, JSON.stringify(payload.startMeta), JSON.stringify(payload.actions), payload.durationTicks, eventsJson]
    );
}

export async function createReplaysForParticipants(pool: Pool, matchId: string): Promise<void> {
    await pool.query(
        `INSERT INTO replays (match_id, created_by_user_id, title, is_public)
         SELECT m.match_id, mp.user_id,
                'Матч ' || COALESCE(NULLIF(TRIM(m.room_code), ''), '?') || ' · ' ||
                TO_CHAR(COALESCE(m.ended_at, NOW()) AT TIME ZONE 'UTC', 'DD.MM.YYYY HH24:MI'),
                FALSE
         FROM matches m
         INNER JOIN match_participants mp ON mp.match_id = m.match_id
         WHERE m.match_id = $1 AND mp.user_id IS NOT NULL`,
        [matchId]
    );
}

export type ReplayListRow = {
    replay_id: string;
    match_id: string;
    title: string;
    is_public: boolean;
    created_at: Date;
    ended_at: Date | null;
    room_code: string | null;
    winner_role: string | null;
    match_status: string | null;
};

export async function listReplaysForUser(pool: Pool, userId: string): Promise<ReplayListRow[]> {
    const r = await pool.query<ReplayListRow>(
        `SELECT r.replay_id, r.match_id, r.title, r.is_public, r.created_at,
                m.ended_at, m.room_code, m.winner_role, m.match_status
         FROM replays r
         INNER JOIN matches m ON m.match_id = r.match_id
         WHERE r.created_by_user_id = $1
         ORDER BY r.created_at DESC
         LIMIT 100`,
        [userId]
    );
    return r.rows;
}

export type ReplayAccessRow = {
    replay_id: string;
    match_id: string;
    title: string;
    is_public: boolean;
    created_at: Date;
    ended_at: Date | null;
    room_code: string | null;
    winner_role: string | null;
    match_status: string | null;
    end_reason: string | null;
    duration_ticks: number | null;
};

export async function getReplayIfAllowed(
    pool: Pool,
    replayId: string,
    userId: string
): Promise<ReplayAccessRow | null> {
    const r = await pool.query<ReplayAccessRow>(
        `SELECT r.replay_id, r.match_id, r.title, r.is_public, r.created_at,
                m.ended_at, m.room_code, m.winner_role, m.match_status, m.end_reason, m.duration_ticks
         FROM replays r
         INNER JOIN matches m ON m.match_id = r.match_id
         WHERE r.replay_id = $1
           AND (
             r.created_by_user_id = $2
             OR r.is_public = TRUE
             OR EXISTS (
               SELECT 1 FROM match_participants mp
               WHERE mp.match_id = r.match_id AND mp.user_id = $2
             )
           )
         LIMIT 1`,
        [replayId, userId]
    );
    return r.rows[0] ?? null;
}

/**
 * В БД, созданной старыми миграциями, могла остаться таблица match_replay_frames.
 * Если для матча есть только она и нет action-лога — это устаревший формат реплея.
 */
export async function hasLegacyMatchReplayFrames(pool: Pool, matchId: string): Promise<boolean> {
    const tableCheck = await pool.query<{ exists: boolean }>(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'match_replay_frames'
        ) AS exists`
    );
    if (!tableCheck.rows[0]?.exists) {
        return false;
    }
    const r = await pool.query(`SELECT 1 FROM match_replay_frames WHERE match_id = $1 LIMIT 1`, [matchId]);
    return (r.rowCount ?? 0) > 0;
}

export async function getReplayActionsForMatch(pool: Pool, matchId: string): Promise<ReplayActionsRow | null> {
    await ensureReplayActionsTable(pool);
    const r = await pool.query<{
        start_meta: ReplayStartMeta;
        actions: ReplayActionEvent[];
        duration_ticks: number | null;
        events: ReplayEvent[] | null;
    }>(
        `SELECT start_meta, actions, duration_ticks, events
         FROM match_replay_actions WHERE match_id = $1 LIMIT 1`,
        [matchId]
    );
    const row = r.rows[0];
    if (!row || !row.start_meta || !Array.isArray(row.actions)) {
        return null;
    }
    const events = Array.isArray(row.events) && row.events.length > 0 ? row.events : null;
    const actions = events ? replayEventsToActionRows(events) : row.actions;
    return {
        startMeta: row.start_meta,
        actions,
        durationTicks: row.duration_ticks,
        events
    };
}

export type MatchParticipantNameRow = {
    role: 'attacker' | 'defender' | 'fighter' | 'spectator';
    display_name: string | null;
};

export async function listParticipantNamesForMatch(pool: Pool, matchId: string): Promise<MatchParticipantNameRow[]> {
    const r = await pool.query<MatchParticipantNameRow>(
        `SELECT mp.role, u.display_name
         FROM match_participants mp
         LEFT JOIN users u ON u.user_id = mp.user_id
         WHERE mp.match_id = $1`,
        [matchId]
    );
    return r.rows;
}

export async function updateReplayMeta(
    pool: Pool,
    replayId: string,
    userId: string,
    params: { title?: string; isPublic?: boolean }
): Promise<boolean> {
    if (params.title !== undefined) {
        const title = params.title.trim();
        if (title.length < 1 || title.length > 200) {
            return false;
        }
    }
    const titleParam = params.title !== undefined ? params.title.trim() : null;
    const publicParam = params.isPublic !== undefined ? params.isPublic : null;
    const r = await pool.query(
        `UPDATE replays SET
            title = COALESCE($3, title),
            is_public = COALESCE($4, is_public),
            updated_at = NOW()
         WHERE replay_id = $1 AND created_by_user_id = $2`,
        [replayId, userId, titleParam, publicParam]
    );
    return (r.rowCount ?? 0) > 0;
}

/** Дополняет строки match_stats именами из участников матча (для записей без displayName). */
export async function enrichMatchStatsDisplayNames(
    pool: Pool,
    matchId: string,
    stats: unknown[]
): Promise<unknown[]> {
    if (!Array.isArray(stats) || stats.length === 0) {
        return stats;
    }
    const r = await pool.query<{ role: string; display_name: string | null }>(
        `SELECT mp.role, u.display_name
         FROM match_participants mp
         LEFT JOIN users u ON u.user_id = mp.user_id
         WHERE mp.match_id = $1 AND mp.role IN ('attacker', 'defender')`,
        [matchId]
    );
    const byRole = new Map<string, string>();
    for (const row of r.rows) {
        const name = row.display_name?.trim();
        if (name) {
            byRole.set(row.role, name);
        }
    }
    return stats.map((raw) => {
        if (!raw || typeof raw !== 'object') {
            return raw;
        }
        const o = raw as Record<string, unknown>;
        const existing =
            typeof o.displayName === 'string' && o.displayName.trim().length > 0
                ? o.displayName.trim()
                : null;
        if (existing) {
            return raw;
        }
        const role = typeof o.role === 'string' ? o.role : '';
        const fromDb = role ? byRole.get(role) : undefined;
        if (fromDb) {
            return { ...o, displayName: fromDb };
        }
        return raw;
    });
}

export type MatchHistoryRow = {
    match_id: string;
    room_code: string | null;
    match_status: string | null;
    winner_role: string | null;
    end_reason: string | null;
    duration_ticks: number | null;
    started_at: Date | null;
    ended_at: Date | null;
    participant_role: string;
    is_winner: boolean;
    match_stats: unknown[] | null;
};

export async function listMatchHistoryForUser(pool: Pool, userId: string, limit = 50): Promise<MatchHistoryRow[]> {
    const r = await pool.query<MatchHistoryRow>(
        `SELECT m.match_id, m.room_code, m.match_status, m.winner_role, m.end_reason, m.duration_ticks,
                m.started_at, m.ended_at, mp.role AS participant_role, mp.is_winner, m.match_stats
         FROM match_participants mp
         INNER JOIN matches m ON m.match_id = mp.match_id
         WHERE mp.user_id = $1
         ORDER BY m.ended_at DESC NULLS LAST, m.created_at DESC
         LIMIT $2`,
        [userId, limit]
    );
    return r.rows;
}
