import type { Pool } from 'pg';

/**
 * Таблица связей между пользователями. Хранит запросы в друзья, принятые
 * дружбы и блокировки. Отдельная строка на «направленное» отношение
 * (requester → addressee): так проще выражать «X отправил запрос Y»,
 * «X заблокировал Y», при этом «дружба» — это две строки accepted в обе
 * стороны (или одна — зависит от реализации; здесь реализовано через
 * status = 'accepted' на строке, принятой адресатом, плюс удаление зеркала).
 *
 * Для простоты держим одну строку на пару (LEAST, GREATEST) для accepted —
 * это упрощает SELECT списка друзей (не дублируется). Для pending/blocked
 * допускаем направленные записи.
 *
 * Статусы:
 *   pending    — запрос отправлен requester → addressee, не принят
 *   accepted   — взаимная дружба (одна строка, LEAST = user_a, GREATEST = user_b)
 *   blocked    — requester заблокировал addressee (однонаправлен)
 *
 * Схема:
 *   user_a uuid  — «младший» id (accepted) или requester (pending/blocked)
 *   user_b uuid  — «старший» id (accepted) или addressee (pending/blocked)
 *   status text  — enum выше
 *   requested_by uuid — кто инициировал (для pending/blocked)
 *   created_at / updated_at
 *
 * Уникальность: (user_a, user_b, status). Допускаем, что одновременно могут
 * существовать pending и blocked от разных сторон, пока не формируется
 * конфликт «дружим-и-блокируем» — такое мы проверяем на уровне API.
 */

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface FriendRow {
    other_user_id: string;
    other_login: string;
    other_display_name: string | null;
    status: FriendshipStatus;
    requested_by_me: boolean;
    created_at: Date;
}

async function ensureSchema(pool: Pool): Promise<void> {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS friendships (
            user_a uuid NOT NULL,
            user_b uuid NOT NULL,
            status text NOT NULL,
            requested_by uuid NOT NULL,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            updated_at timestamptz NOT NULL DEFAULT NOW(),
            PRIMARY KEY (user_a, user_b, status),
            CHECK (user_a <> user_b),
            CHECK (status IN ('pending', 'accepted', 'blocked'))
        )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_friendships_user_a ON friendships(user_a)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_friendships_user_b ON friendships(user_b)`);
}

function pair(a: string, b: string): { lo: string; hi: string } {
    return a < b ? { lo: a, hi: b } : { lo: b, hi: a };
}

/**
 * Отправить запрос в друзья (requester → addressee). Если между ними уже есть
 * accepted — возвращаем 'already_friends'. Если requester заблокировал или
 * заблокирован — 'blocked'. Иначе вставляем pending (если ещё нет).
 */
export async function sendFriendRequest(
    pool: Pool,
    requesterId: string,
    addresseeId: string
): Promise<'ok' | 'already_friends' | 'already_pending' | 'blocked' | 'self' | 'user_not_found'> {
    if (requesterId === addresseeId) return 'self';
    await ensureSchema(pool);

    const u = await pool.query('SELECT 1 FROM users WHERE user_id = $1 LIMIT 1', [addresseeId]);
    if (u.rowCount === 0) return 'user_not_found';

    const { lo, hi } = pair(requesterId, addresseeId);
    const existing = await pool.query<{ status: FriendshipStatus; requested_by: string }>(
        `SELECT status, requested_by FROM friendships
         WHERE user_a = $1 AND user_b = $2`,
        [lo, hi]
    );
    for (const row of existing.rows) {
        if (row.status === 'accepted') return 'already_friends';
        if (row.status === 'blocked') return 'blocked';
        if (row.status === 'pending') {
            if (row.requested_by === addresseeId) {
                // Встречный запрос — принимаем автоматически (удобный UX)
                await acceptFriendRequestInternal(pool, requesterId, addresseeId);
                return 'ok';
            }
            return 'already_pending';
        }
    }

    await pool.query(
        `INSERT INTO friendships (user_a, user_b, status, requested_by)
         VALUES ($1, $2, 'pending', $3)
         ON CONFLICT DO NOTHING`,
        [lo, hi, requesterId]
    );
    return 'ok';
}

async function acceptFriendRequestInternal(pool: Pool, userA: string, userB: string): Promise<void> {
    const { lo, hi } = pair(userA, userB);
    await pool.query('BEGIN');
    try {
        await pool.query(
            `DELETE FROM friendships WHERE user_a = $1 AND user_b = $2 AND status = 'pending'`,
            [lo, hi]
        );
        await pool.query(
            `INSERT INTO friendships (user_a, user_b, status, requested_by, updated_at)
             VALUES ($1, $2, 'accepted', $3, NOW())
             ON CONFLICT DO NOTHING`,
            [lo, hi, userA]
        );
        await pool.query('COMMIT');
    } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
    }
}

export async function acceptFriendRequest(
    pool: Pool,
    meId: string,
    otherId: string
): Promise<'ok' | 'no_pending'> {
    await ensureSchema(pool);
    const { lo, hi } = pair(meId, otherId);
    const r = await pool.query<{ requested_by: string }>(
        `SELECT requested_by FROM friendships
         WHERE user_a = $1 AND user_b = $2 AND status = 'pending'`,
        [lo, hi]
    );
    const row = r.rows[0];
    if (!row || row.requested_by !== otherId) return 'no_pending';
    await acceptFriendRequestInternal(pool, meId, otherId);
    return 'ok';
}

export async function rejectFriendRequest(
    pool: Pool,
    meId: string,
    otherId: string
): Promise<boolean> {
    await ensureSchema(pool);
    const { lo, hi } = pair(meId, otherId);
    const r = await pool.query(
        `DELETE FROM friendships
         WHERE user_a = $1 AND user_b = $2 AND status = 'pending' AND requested_by = $3`,
        [lo, hi, otherId]
    );
    return (r.rowCount ?? 0) > 0;
}

export async function removeFriend(pool: Pool, meId: string, otherId: string): Promise<boolean> {
    await ensureSchema(pool);
    const { lo, hi } = pair(meId, otherId);
    const r = await pool.query(
        `DELETE FROM friendships
         WHERE user_a = $1 AND user_b = $2 AND status IN ('pending', 'accepted')`,
        [lo, hi]
    );
    return (r.rowCount ?? 0) > 0;
}

export async function blockUser(pool: Pool, meId: string, otherId: string): Promise<'ok' | 'self'> {
    if (meId === otherId) return 'self';
    await ensureSchema(pool);
    const { lo, hi } = pair(meId, otherId);
    await pool.query('BEGIN');
    try {
        // Чистим любые дружбы/запросы
        await pool.query(
            `DELETE FROM friendships
             WHERE user_a = $1 AND user_b = $2 AND status IN ('pending', 'accepted')`,
            [lo, hi]
        );
        await pool.query(
            `INSERT INTO friendships (user_a, user_b, status, requested_by)
             VALUES ($1, $2, 'blocked', $3)
             ON CONFLICT DO NOTHING`,
            [lo, hi, meId]
        );
        await pool.query('COMMIT');
        return 'ok';
    } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
    }
}

export async function unblockUser(pool: Pool, meId: string, otherId: string): Promise<boolean> {
    await ensureSchema(pool);
    const { lo, hi } = pair(meId, otherId);
    const r = await pool.query(
        `DELETE FROM friendships
         WHERE user_a = $1 AND user_b = $2 AND status = 'blocked' AND requested_by = $3`,
        [lo, hi, meId]
    );
    return (r.rowCount ?? 0) > 0;
}

export async function listFriends(pool: Pool, meId: string): Promise<FriendRow[]> {
    await ensureSchema(pool);
    const r = await pool.query<FriendRow>(
        `SELECT
            CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END AS other_user_id,
            u.login AS other_login,
            u.display_name AS other_display_name,
            f.status,
            (f.requested_by = $1) AS requested_by_me,
            f.created_at
         FROM friendships f
         INNER JOIN users u ON u.user_id = (CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END)
         WHERE (f.user_a = $1 OR f.user_b = $1) AND f.status = 'accepted'
         ORDER BY u.display_name NULLS LAST, u.login`,
        [meId]
    );
    return r.rows;
}

export async function listIncomingRequests(pool: Pool, meId: string): Promise<FriendRow[]> {
    await ensureSchema(pool);
    const r = await pool.query<FriendRow>(
        `SELECT
            f.requested_by AS other_user_id,
            u.login AS other_login,
            u.display_name AS other_display_name,
            f.status,
            FALSE AS requested_by_me,
            f.created_at
         FROM friendships f
         INNER JOIN users u ON u.user_id = f.requested_by
         WHERE (f.user_a = $1 OR f.user_b = $1) AND f.status = 'pending' AND f.requested_by <> $1
         ORDER BY f.created_at DESC`,
        [meId]
    );
    return r.rows;
}

export async function listOutgoingRequests(pool: Pool, meId: string): Promise<FriendRow[]> {
    await ensureSchema(pool);
    const r = await pool.query<FriendRow>(
        `SELECT
            CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END AS other_user_id,
            u.login AS other_login,
            u.display_name AS other_display_name,
            f.status,
            TRUE AS requested_by_me,
            f.created_at
         FROM friendships f
         INNER JOIN users u ON u.user_id = (CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END)
         WHERE (f.user_a = $1 OR f.user_b = $1) AND f.status = 'pending' AND f.requested_by = $1
         ORDER BY f.created_at DESC`,
        [meId]
    );
    return r.rows;
}

export async function listBlocked(pool: Pool, meId: string): Promise<FriendRow[]> {
    await ensureSchema(pool);
    const r = await pool.query<FriendRow>(
        `SELECT
            CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END AS other_user_id,
            u.login AS other_login,
            u.display_name AS other_display_name,
            f.status,
            TRUE AS requested_by_me,
            f.created_at
         FROM friendships f
         INNER JOIN users u ON u.user_id = (CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END)
         WHERE f.status = 'blocked' AND f.requested_by = $1`,
        [meId]
    );
    return r.rows;
}

export async function isBlockedBetween(
    pool: Pool,
    a: string,
    b: string
): Promise<boolean> {
    await ensureSchema(pool);
    const { lo, hi } = pair(a, b);
    const r = await pool.query(
        `SELECT 1 FROM friendships WHERE user_a = $1 AND user_b = $2 AND status = 'blocked' LIMIT 1`,
        [lo, hi]
    );
    return (r.rowCount ?? 0) > 0;
}

/** Принятая дружба хранится одной строкой с user_a = LEAST, user_b = GREATEST. */
export async function areAcceptedFriends(pool: Pool, a: string, b: string): Promise<boolean> {
    if (a === b) return false;
    await ensureSchema(pool);
    const { lo, hi } = pair(a, b);
    const r = await pool.query(
        `SELECT 1 FROM friendships WHERE user_a = $1 AND user_b = $2 AND status = 'accepted' LIMIT 1`,
        [lo, hi]
    );
    return (r.rowCount ?? 0) > 0;
}

export async function searchUsers(
    pool: Pool,
    meId: string,
    query: string,
    limit = 20
): Promise<Array<{ user_id: string; login: string; display_name: string | null }>> {
    const q = query.trim();
    if (q.length < 2) return [];
    const r = await pool.query<{ user_id: string; login: string; display_name: string | null }>(
        `SELECT u.user_id, u.login, u.display_name
         FROM users u
         WHERE u.user_id <> $1
           AND (
               LOWER(u.login) LIKE LOWER($2) OR
               LOWER(COALESCE(u.display_name, '')) LIKE LOWER($2)
           )
         ORDER BY u.login
         LIMIT $3`,
        [meId, `%${q}%`, limit]
    );
    return r.rows;
}
