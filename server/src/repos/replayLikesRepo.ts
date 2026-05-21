import type { Pool } from 'pg';

/**
 * Таблица лайков на реплеи. Один пользователь — один лайк на реплей.
 * Cчётчик денормализуем как COUNT(*) в выборках — для публичной галереи
 * по сотне-другой записей это дешевле, чем поддерживать отдельную колонку.
 */

async function ensureSchema(pool: Pool): Promise<void> {
    await pool.query(`ALTER TABLE replays ADD COLUMN IF NOT EXISTS shared_slug TEXT`);
    await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_replays_shared_slug
         ON replays (shared_slug) WHERE shared_slug IS NOT NULL`
    );
    await pool.query(`
        CREATE TABLE IF NOT EXISTS replay_likes (
            replay_id uuid NOT NULL REFERENCES replays(replay_id) ON DELETE CASCADE,
            user_id   uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            PRIMARY KEY (replay_id, user_id)
        )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_replay_likes_replay ON replay_likes(replay_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_replay_likes_user ON replay_likes(user_id)`);
}

export async function likeReplay(
    pool: Pool,
    replayId: string,
    userId: string
): Promise<'ok' | 'not_public'> {
    await ensureSchema(pool);
    // Лайкать можно только публичные реплеи
    const r = await pool.query<{ is_public: boolean }>(
        `SELECT is_public FROM replays WHERE replay_id = $1 LIMIT 1`,
        [replayId]
    );
    const row = r.rows[0];
    if (!row || !row.is_public) return 'not_public';
    await pool.query(
        `INSERT INTO replay_likes (replay_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [replayId, userId]
    );
    return 'ok';
}

export async function unlikeReplay(pool: Pool, replayId: string, userId: string): Promise<void> {
    await ensureSchema(pool);
    await pool.query(
        `DELETE FROM replay_likes WHERE replay_id = $1 AND user_id = $2`,
        [replayId, userId]
    );
}

export interface PublicReplayRow {
    replay_id: string;
    match_id: string;
    title: string;
    shared_slug: string | null;
    is_public: boolean;
    created_at: Date;
    ended_at: Date | null;
    room_code: string | null;
    winner_role: string | null;
    match_status: string | null;
    duration_ticks: number | null;
    owner_display_name: string | null;
    like_count: number;
    liked_by_me: boolean;
}

export async function listPublicReplays(
    pool: Pool,
    meId: string | null,
    params: { limit?: number; offset?: number; sort?: 'new' | 'top' } = {}
): Promise<PublicReplayRow[]> {
    await ensureSchema(pool);
    const limit = Math.min(Math.max(1, params.limit ?? 30), 100);
    const offset = Math.max(0, params.offset ?? 0);
    const orderBy = params.sort === 'top' ? 'like_count DESC, r.created_at DESC' : 'r.created_at DESC';

    const r = await pool.query<PublicReplayRow>(
        `SELECT
            r.replay_id,
            r.match_id,
            r.title,
            r.shared_slug,
            r.is_public,
            r.created_at,
            m.ended_at,
            m.room_code,
            m.winner_role,
            m.match_status,
            m.duration_ticks,
            u.display_name AS owner_display_name,
            (SELECT COUNT(*)::int FROM replay_likes l WHERE l.replay_id = r.replay_id) AS like_count,
            CASE
                WHEN $1::uuid IS NULL THEN FALSE
                ELSE EXISTS (
                    SELECT 1 FROM replay_likes l WHERE l.replay_id = r.replay_id AND l.user_id = $1
                )
            END AS liked_by_me
         FROM replays r
         INNER JOIN matches m ON m.match_id = r.match_id
         LEFT JOIN users u ON u.user_id = r.created_by_user_id
         WHERE r.is_public = TRUE
         ORDER BY ${orderBy}
         LIMIT $2 OFFSET $3`,
        [meId, limit, offset]
    );
    return r.rows;
}

export async function getLikeInfo(
    pool: Pool,
    replayId: string,
    meId: string
): Promise<{ likeCount: number; likedByMe: boolean }> {
    await ensureSchema(pool);
    const r = await pool.query<{ like_count: number; liked_by_me: boolean }>(
        `SELECT
            (SELECT COUNT(*)::int FROM replay_likes l WHERE l.replay_id = $1) AS like_count,
            EXISTS (SELECT 1 FROM replay_likes l WHERE l.replay_id = $1 AND l.user_id = $2) AS liked_by_me`,
        [replayId, meId]
    );
    const row = r.rows[0];
    return {
        likeCount: Number(row?.like_count ?? 0),
        likedByMe: Boolean(row?.liked_by_me)
    };
}
