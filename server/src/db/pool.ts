import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool | null {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
        return null;
    }
    if (!pool) {
        pool = new Pool({ connectionString: url });
    }
    return pool;
}

export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
