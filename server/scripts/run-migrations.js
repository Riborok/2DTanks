#!/usr/bin/env node
/**
 * Применяет SQL-миграции из каталога server/sql по возрастанию имени файла.
 * Требуется DATABASE_URL в .env (корень server/) или в окружении.
 *
 * Использование (из каталога server):
 *   node scripts/run-migrations.js
 *   npm run migrate
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SQL_DIR = path.join(__dirname, '..', 'sql');

/**
 * Делит SQL на отдельные команды по `;` вне одинарных и двойных кавычек.
 * Подходит для миграций без тел $$ ... $$ (функции/триггеры с долларовым квотированием).
 */
function splitSqlStatements(sql) {
    const statements = [];
    let buf = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < sql.length; i++) {
        const c = sql[i];
        const next = sql[i + 1];

        if (c === "'" && !inDouble) {
            if (inSingle && next === "'") {
                buf += "''";
                i++;
                continue;
            }
            inSingle = !inSingle;
            buf += c;
            continue;
        }

        if (c === '"' && !inSingle) {
            inDouble = !inDouble;
            buf += c;
            continue;
        }

        if (c === ';' && !inSingle && !inDouble) {
            const t = buf.trim();
            if (t.length > 0) {
                statements.push(t);
            }
            buf = '';
            continue;
        }

        buf += c;
    }

    const tail = buf.trim();
    if (tail.length > 0) {
        statements.push(tail);
    }

    return statements;
}

async function ensureMigrationsTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

async function isApplied(client, name) {
    const r = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    return r.rowCount > 0;
}

async function markApplied(client, name) {
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
}

async function runMigrationFile(client, fileName, sqlText) {
    const parts = splitSqlStatements(sqlText);
    if (parts.length === 0) {
        console.warn(`[migrate] Пропуск пустого файла: ${fileName}`);
        return;
    }

    await client.query('BEGIN');
    try {
        for (let i = 0; i < parts.length; i++) {
            await client.query(parts[i]);
        }
        await markApplied(client, fileName);
        await client.query('COMMIT');
        console.log(`[migrate] OK: ${fileName} (${parts.length} команд)`);
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
}

async function main() {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
        console.error('Ошибка: задайте DATABASE_URL в server/.env или в окружении.');
        process.exit(1);
    }

    if (!fs.existsSync(SQL_DIR)) {
        console.error('Ошибка: каталог не найден:', SQL_DIR);
        process.exit(1);
    }

    const files = fs
        .readdirSync(SQL_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    if (files.length === 0) {
        console.log('Нет .sql файлов в', SQL_DIR);
        process.exit(0);
    }

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();

    try {
        await ensureMigrationsTable(client);

        for (const fileName of files) {
            if (await isApplied(client, fileName)) {
                console.log(`[migrate] Уже применено: ${fileName}`);
                continue;
            }

            const fullPath = path.join(SQL_DIR, fileName);
            const sqlText = fs.readFileSync(fullPath, 'utf8');
            console.log(`[migrate] Применяю: ${fileName} ...`);
            await runMigrationFile(client, fileName, sqlText);
        }

        console.log('[migrate] Готово.');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error('[migrate] Ошибка:', err.message || err);
    process.exit(1);
});
