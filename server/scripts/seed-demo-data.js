#!/usr/bin/env node
/**
 * Создает демо-пользователей и демо-матчи с подробной статистикой.
 * Использование:
 *   npm run db:seed:demo
 */

const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DEMO_USERS = [
    { login: 'demo_alex', email: 'demo_alex@example.com', displayName: 'Alex Demo' },
    { login: 'demo_ivan', email: 'demo_ivan@example.com', displayName: 'Ivan Demo' },
    { login: 'demo_mira', email: 'demo_mira@example.com', displayName: 'Mira Demo' }
];

const DEMO_PASSWORD = 'Demo12345';

async function upsertUser(client, user, passwordHash) {
    const r = await client.query(
        `INSERT INTO users (login, email, password_hash, display_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (login) DO UPDATE SET
             email = EXCLUDED.email,
             password_hash = EXCLUDED.password_hash,
             display_name = EXCLUDED.display_name,
             updated_at = NOW()
         RETURNING user_id, login`,
        [user.login, user.email, passwordHash, user.displayName]
    );
    const row = r.rows[0];
    await client.query(
        `INSERT INTO user_profiles (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [row.user_id]
    );
    return row;
}

function statsRow(playerId, role, values) {
    return {
        playerId,
        role,
        kills: values.kills,
        deaths: values.deaths,
        shotsFired: values.shotsFired,
        shotsHit: values.shotsHit,
        damageDealt: values.damageDealt,
        damageTaken: values.damageTaken,
        keyPickups: values.keyPickups,
        ammoPickups: values.ammoPickups
    };
}

async function createDemoMatch(client, params) {
    const matchType = await client.query(`SELECT match_type_id FROM match_types WHERE code = 'standard' LIMIT 1`);
    if (!matchType.rows[0]) {
        throw new Error('Не найден match_type "standard". Сначала выполните миграции.');
    }
    const matchTypeId = matchType.rows[0].match_type_id;

    const matchStats = [
        statsRow(params.attackerPlayerTag, 'attacker', params.attackerStats),
        statsRow(params.defenderPlayerTag, 'defender', params.defenderStats)
    ];

    const matchRes = await client.query(
        `INSERT INTO matches (
            match_type_id, room_code, match_status, winner_role, end_reason,
            duration_ticks, started_at, ended_at, match_stats
        ) VALUES (
            $1, $2, 'completed', $3, $4, $5,
            NOW() - ($6::int || ' minutes')::interval,
            NOW() - ($7::int || ' minutes')::interval,
            $8::jsonb
        )
        RETURNING match_id`,
        [
            matchTypeId,
            params.roomCode,
            params.winnerRole,
            params.endReason,
            params.durationTicks,
            params.startedMinutesAgo,
            params.endedMinutesAgo,
            JSON.stringify(matchStats)
        ]
    );
    const matchId = matchRes.rows[0].match_id;

    await client.query(
        `INSERT INTO match_participants (
            match_id, user_id, role, tank_color, tank_hull_num, tank_track_num, tank_turret_num, tank_weapon_num,
            kills_count, deaths_count, is_winner
        ) VALUES
            ($1, $2, 'attacker', '0', 1, 1, 1, 1, $3, $4, $5),
            ($1, $6, 'defender', '2', 2, 2, 2, 2, $7, $8, $9)`,
        [
            matchId,
            params.attackerUserId,
            params.attackerStats.kills,
            params.attackerStats.deaths,
            params.winnerRole === 'attacker',
            params.defenderUserId,
            params.defenderStats.kills,
            params.defenderStats.deaths,
            params.winnerRole === 'defender'
        ]
    );

    return matchId;
}

async function main() {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
        console.error('Ошибка: задайте DATABASE_URL в server/.env или в окружении.');
        process.exit(1);
    }

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();

    try {
        await client.query('BEGIN');
        await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_stats JSONB`);

        await client.query(
            `DELETE FROM matches
             WHERE room_code LIKE 'DEMO-%'`
        );

        const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
        const users = {};
        for (const user of DEMO_USERS) {
            const saved = await upsertUser(client, user, passwordHash);
            users[saved.login] = saved.user_id;
        }

        await createDemoMatch(client, {
            roomCode: 'DEMO-1001',
            winnerRole: 'attacker',
            endReason: 'base_destroyed',
            durationTicks: 1620,
            startedMinutesAgo: 55,
            endedMinutesAgo: 40,
            attackerUserId: users.demo_alex,
            defenderUserId: users.demo_ivan,
            attackerPlayerTag: 'demo_alex',
            defenderPlayerTag: 'demo_ivan',
            attackerStats: {
                kills: 4,
                deaths: 2,
                shotsFired: 31,
                shotsHit: 19,
                damageDealt: 1280,
                damageTaken: 740,
                keyPickups: 2,
                ammoPickups: 3
            },
            defenderStats: {
                kills: 2,
                deaths: 4,
                shotsFired: 27,
                shotsHit: 11,
                damageDealt: 760,
                damageTaken: 1290,
                keyPickups: 1,
                ammoPickups: 4
            }
        });

        await createDemoMatch(client, {
            roomCode: 'DEMO-1002',
            winnerRole: 'defender',
            endReason: 'time_out',
            durationTicks: 2100,
            startedMinutesAgo: 35,
            endedMinutesAgo: 18,
            attackerUserId: users.demo_mira,
            defenderUserId: users.demo_alex,
            attackerPlayerTag: 'demo_mira',
            defenderPlayerTag: 'demo_alex',
            attackerStats: {
                kills: 1,
                deaths: 3,
                shotsFired: 24,
                shotsHit: 8,
                damageDealt: 580,
                damageTaken: 990,
                keyPickups: 0,
                ammoPickups: 2
            },
            defenderStats: {
                kills: 3,
                deaths: 1,
                shotsFired: 29,
                shotsHit: 16,
                damageDealt: 1030,
                damageTaken: 610,
                keyPickups: 2,
                ammoPickups: 1
            }
        });

        await createDemoMatch(client, {
            roomCode: 'DEMO-1003',
            winnerRole: 'attacker',
            endReason: 'enemy_eliminated',
            durationTicks: 1340,
            startedMinutesAgo: 14,
            endedMinutesAgo: 3,
            attackerUserId: users.demo_ivan,
            defenderUserId: users.demo_mira,
            attackerPlayerTag: 'demo_ivan',
            defenderPlayerTag: 'demo_mira',
            attackerStats: {
                kills: 5,
                deaths: 1,
                shotsFired: 34,
                shotsHit: 22,
                damageDealt: 1440,
                damageTaken: 420,
                keyPickups: 3,
                ammoPickups: 2
            },
            defenderStats: {
                kills: 1,
                deaths: 5,
                shotsFired: 25,
                shotsHit: 7,
                damageDealt: 410,
                damageTaken: 1470,
                keyPickups: 0,
                ammoPickups: 5
            }
        });

        await client.query('COMMIT');

        console.log('[db:seed:demo] Демо-данные созданы.');
        console.log(`[db:seed:demo] Логины: ${DEMO_USERS.map((u) => u.login).join(', ')}`);
        console.log(`[db:seed:demo] Пароль для всех: ${DEMO_PASSWORD}`);
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error('[db:seed:demo] Ошибка:', err.message || err);
    process.exit(1);
});
