#!/usr/bin/env node
/**
 * Полная очистка БД: удаляет схему public целиком и пересоздает ее.
 * Использование:
 *   npm run db:wipe
 */

const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
        console.error('Ошибка: задайте DATABASE_URL в server/.env или в окружении.');
        process.exit(1);
    }

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();

    try {
        console.log('[db:wipe] Удаляю schema public...');
        await client.query('DROP SCHEMA IF EXISTS public CASCADE');
        await client.query('CREATE SCHEMA public');
        await client.query('GRANT ALL ON SCHEMA public TO CURRENT_USER');
        await client.query('GRANT ALL ON SCHEMA public TO public');
        console.log('[db:wipe] База полностью очищена.');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error('[db:wipe] Ошибка:', err.message || err);
    process.exit(1);
});
