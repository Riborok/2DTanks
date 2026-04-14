import type { Pool } from 'pg';
import type { UserProfileRow, UserRow } from '../auth/types';

export async function findUserByLogin(pool: Pool, login: string): Promise<UserRow | null> {
    const r = await pool.query<UserRow>(
        `SELECT user_id, login, email, password_hash, display_name, created_at, updated_at
         FROM users WHERE LOWER(login) = LOWER($1) LIMIT 1`,
        [login]
    );
    return r.rows[0] ?? null;
}

export async function findUserByEmail(pool: Pool, email: string): Promise<UserRow | null> {
    const r = await pool.query<UserRow>(
        `SELECT user_id, login, email, password_hash, display_name, created_at, updated_at
         FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email]
    );
    return r.rows[0] ?? null;
}

export async function findUserById(pool: Pool, userId: string): Promise<UserRow | null> {
    const r = await pool.query<UserRow>(
        `SELECT user_id, login, email, password_hash, display_name, created_at, updated_at
         FROM users WHERE user_id = $1 LIMIT 1`,
        [userId]
    );
    return r.rows[0] ?? null;
}

export async function createUser(
    pool: Pool,
    params: { login: string; email: string; passwordHash: string; displayName: string }
): Promise<UserRow> {
    const r = await pool.query<UserRow>(
        `INSERT INTO users (login, email, password_hash, display_name)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id, login, email, password_hash, display_name, created_at, updated_at`,
        [params.login, params.email, params.passwordHash, params.displayName]
    );
    const user = r.rows[0];
    await pool.query(`INSERT INTO user_profiles (user_id) VALUES ($1)`, [user.user_id]);
    return user;
}

export async function getProfileByUserId(pool: Pool, userId: string): Promise<UserProfileRow | null> {
    const r = await pool.query<UserProfileRow>(
        `SELECT profile_id, user_id, avatar_url, preferred_role, created_at, updated_at
         FROM user_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
    );
    return r.rows[0] ?? null;
}

export async function updateUserProfile(
    pool: Pool,
    userId: string,
    params: { avatarUrl?: string | null; preferredRole?: 'attacker' | 'defender' | null }
): Promise<boolean> {
    if (params.avatarUrl === undefined && params.preferredRole === undefined) {
        return false;
    }
    if (params.avatarUrl !== undefined && params.preferredRole !== undefined) {
        const r = await pool.query(
            `UPDATE user_profiles SET avatar_url = $2, preferred_role = $3, updated_at = NOW() WHERE user_id = $1`,
            [userId, params.avatarUrl, params.preferredRole]
        );
        return (r.rowCount ?? 0) > 0;
    }
    if (params.avatarUrl !== undefined) {
        const r = await pool.query(
            `UPDATE user_profiles SET avatar_url = $2, updated_at = NOW() WHERE user_id = $1`,
            [userId, params.avatarUrl]
        );
        return (r.rowCount ?? 0) > 0;
    }
    if (params.preferredRole !== undefined) {
        const r = await pool.query(
            `UPDATE user_profiles SET preferred_role = $2, updated_at = NOW() WHERE user_id = $1`,
            [userId, params.preferredRole]
        );
        return (r.rowCount ?? 0) > 0;
    }
    return false;
}
