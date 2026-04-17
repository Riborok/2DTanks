#!/usr/bin/env node
/**
 * Единая точка входа для всех тестовых / демо-данных в БД:
 *   1) демо-пользователи + демо-матчи (история, статистика);
 *   2) предустановленные сеты танков (архетипы) для быстрого выбора в игре.
 *
 * Использование (из каталога server):
 *   npm run db:seed:test
 *   node scripts/seed-test-data.js --only=demo
 *   node scripts/seed-test-data.js --only=presets
 *   node scripts/seed-test-data.js --only=presets --user=demo_alex
 *   node scripts/seed-test-data.js --force              # перезаписать пресеты с теми же именами
 *   node scripts/seed-test-data.js --dry-run            # без INSERT/UPDATE (план демо + пресетов в лог)
 *
 * npm: db:seed:test (всё), db:seed:demo, db:seed:presets — см. server/package.json.
 * Скрипты seed-demo-data.js и seed-tank-presets.js вызывают этот файл с --only=...
 */

const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ─── Демо: пользователи ─────────────────────────────────────────────────────

const DEMO_USERS = [
    { login: 'demo_alex', email: 'demo_alex@example.com', displayName: 'Alex Demo' },
    { login: 'demo_ivan', email: 'demo_ivan@example.com', displayName: 'Ivan Demo' },
    { login: 'demo_mira', email: 'demo_mira@example.com', displayName: 'Mira Demo' }
];

const DEMO_PASSWORD = 'Demo12345';

// ─── Демо: матчи (после upsert пользователей заполняется users[login] = user_id) ─

const DEMO_MATCHES = [
    {
        roomCode: 'DEMO-1001',
        winnerRole: 'attacker',
        endReason: 'base_destroyed',
        durationTicks: 1620,
        startedMinutesAgo: 55,
        endedMinutesAgo: 40,
        attackerLogin: 'demo_alex',
        defenderLogin: 'demo_ivan',
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
    },
    {
        roomCode: 'DEMO-1002',
        winnerRole: 'defender',
        endReason: 'time_out',
        durationTicks: 2100,
        startedMinutesAgo: 35,
        endedMinutesAgo: 18,
        attackerLogin: 'demo_mira',
        defenderLogin: 'demo_alex',
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
    },
    {
        roomCode: 'DEMO-1003',
        winnerRole: 'attacker',
        endReason: 'enemy_eliminated',
        durationTicks: 1340,
        startedMinutesAgo: 14,
        endedMinutesAgo: 3,
        attackerLogin: 'demo_ivan',
        defenderLogin: 'demo_mira',
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
    }
];

// ─── Пресеты танков (архетипы; имена — ключ дедупликации) ───────────────────

const TANK_ARCHETYPE_PRESETS = [
    {
        name: 'Тяжёлый штурмовик',
        color: 0,
        hullNum: 2,
        trackNum: 2,
        turretNum: 5,
        weaponNum: 6
    },
    {
        name: 'Лёгкий скаут',
        color: 3,
        hullNum: 7,
        trackNum: 1,
        turretNum: 7,
        weaponNum: 1
    },
    {
        name: 'Броненосец',
        color: 2,
        hullNum: 3,
        trackNum: 0,
        turretNum: 2,
        weaponNum: 2
    },
    {
        name: 'Манёвренный',
        color: 1,
        hullNum: 5,
        trackNum: 3,
        turretNum: 7,
        weaponNum: 4
    },
    {
        name: 'Скорострел',
        color: 1,
        hullNum: 4,
        trackNum: 1,
        turretNum: 1,
        weaponNum: 5
    },
    {
        name: 'Сбалансированный',
        color: 0,
        hullNum: 0,
        trackNum: 0,
        turretNum: 0,
        weaponNum: 0
    }
];

const MAX_PRESETS_PER_USER = 10;

// ─── Парсинг аргументов ─────────────────────────────────────────────────────

function parseArgs(argv) {
    const args = {
        only: null,
        user: null,
        force: false,
        dryRun: false
    };
    for (const raw of argv.slice(2)) {
        if (raw === '--force') {
            args.force = true;
        } else if (raw === '--dry-run' || raw === '--dry') {
            args.dryRun = true;
        } else if (raw.startsWith('--only=')) {
            const v = raw.slice('--only='.length).trim().toLowerCase();
            if (v === 'demo' || v === 'presets') {
                args.only = v;
            } else {
                console.warn(`[seed-test] Неизвестное значение --only=${v}, ожидается demo или presets`);
            }
        } else if (raw.startsWith('--user=')) {
            args.user = raw.slice('--user='.length).trim() || null;
        } else if (raw === '--help' || raw === '-h') {
            console.log(
                [
                    'Использование: node scripts/seed-test-data.js [опции]',
                    '',
                    '  (без --only)     демо-пользователи + матчи, затем пресеты для всех пользователей',
                    '  --only=demo      только демо-пользователи и демо-матчи',
                    '  --only=presets   только пресеты танков',
                    '  --user=<login>   пресеты: только пользователь (login или display_name)',
                    '  --force          пресеты: перезаписать существующие с теми же именами',
                    '  --dry-run        пресеты: без INSERT/UPDATE; демо-блок тоже не пишет в БД'
                ].join('\n')
            );
            process.exit(0);
        } else {
            console.warn(`[seed-test] Неизвестный аргумент: ${raw}`);
        }
    }
    return args;
}

// ─── Демо: логика ───────────────────────────────────────────────────────────

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

async function createDemoMatch(client, params, usersByLogin) {
    const attackerUserId = usersByLogin[params.attackerLogin];
    const defenderUserId = usersByLogin[params.defenderLogin];
    if (!attackerUserId || !defenderUserId) {
        throw new Error(`Нет user_id для матча ${params.roomCode}`);
    }

    const matchStats = [
        statsRow(params.attackerPlayerTag, 'attacker', params.attackerStats),
        statsRow(params.defenderPlayerTag, 'defender', params.defenderStats)
    ];

    const matchType = await client.query(`SELECT match_type_id FROM match_types WHERE code = 'standard' LIMIT 1`);
    if (!matchType.rows[0]) {
        throw new Error('Не найден match_type "standard". Сначала выполните миграции.');
    }
    const matchTypeId = matchType.rows[0].match_type_id;

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
            attackerUserId,
            params.attackerStats.kills,
            params.attackerStats.deaths,
            params.winnerRole === 'attacker',
            defenderUserId,
            params.defenderStats.kills,
            params.defenderStats.deaths,
            params.winnerRole === 'defender'
        ]
    );

    return matchId;
}

async function seedDemoBlock(client, args) {
    console.log('\n[seed-test] === Демо: пользователи и матчи ===');

    if (args.dryRun) {
        console.log('[seed-test] [dry-run] ALTER matches ADD COLUMN IF NOT EXISTS match_stats JSONB');
        console.log('[seed-test] [dry-run] DELETE FROM matches WHERE room_code LIKE \'DEMO-%\'');
        for (const user of DEMO_USERS) {
            console.log(`[seed-test] [dry-run] upsert user ${user.login} / ${user.email}`);
        }
        for (const m of DEMO_MATCHES) {
            console.log(
                `[seed-test] [dry-run] INSERT match ${m.roomCode} (${m.attackerLogin} vs ${m.defenderLogin}, winner=${m.winnerRole})`
            );
        }
        console.log(`[seed-test] [dry-run] пароль для демо: ${DEMO_PASSWORD}`);
        console.log('[seed-test] Демо-блок (план) готов.');
        return;
    }

    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_stats JSONB`);
    await client.query(`DELETE FROM matches WHERE room_code LIKE 'DEMO-%'`);

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const usersByLogin = {};

    for (const user of DEMO_USERS) {
        const saved = await upsertUser(client, user, passwordHash);
        usersByLogin[user.login] = saved.user_id;
    }

    for (const m of DEMO_MATCHES) {
        await createDemoMatch(client, m, usersByLogin);
    }

    console.log('[seed-test] Демо-блок готов.');
    console.log(`[seed-test] Логины: ${DEMO_USERS.map((u) => u.login).join(', ')}`);
    console.log(`[seed-test] Пароль для всех демо: ${DEMO_PASSWORD}`);
}

// ─── Пресеты: логика ───────────────────────────────────────────────────────

async function fetchUsersForPresets(client, loginFilter) {
    if (loginFilter) {
        const r = await client.query(
            `SELECT user_id, login, display_name
             FROM users
             WHERE login = $1 OR display_name = $1
             ORDER BY login`,
            [loginFilter]
        );
        return r.rows;
    }
    const r = await client.query(`SELECT user_id, login, display_name FROM users ORDER BY login`);
    return r.rows;
}

async function fetchUserPresets(client, userId) {
    const r = await client.query(
        `SELECT preset_id, name FROM user_tank_presets WHERE user_id = $1`,
        [userId]
    );
    return r.rows;
}

async function insertPreset(client, userId, preset, dryRun) {
    if (dryRun) {
        return;
    }
    await client.query(
        `INSERT INTO user_tank_presets (
            user_id, name,
            tank_color, tank_hull_num, tank_track_num, tank_turret_num, tank_weapon_num
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            userId,
            preset.name,
            preset.color,
            preset.hullNum,
            preset.trackNum,
            preset.turretNum,
            preset.weaponNum
        ]
    );
}

async function updatePreset(client, presetId, preset, dryRun) {
    if (dryRun) {
        return;
    }
    await client.query(
        `UPDATE user_tank_presets SET
            tank_color = $2,
            tank_hull_num = $3,
            tank_track_num = $4,
            tank_turret_num = $5,
            tank_weapon_num = $6,
            updated_at = NOW()
         WHERE preset_id = $1`,
        [
            presetId,
            preset.color,
            preset.hullNum,
            preset.trackNum,
            preset.turretNum,
            preset.weaponNum
        ]
    );
}

async function seedPresetsForUser(client, user, args) {
    const existing = await fetchUserPresets(client, user.user_id);
    const byName = new Map(existing.map((p) => [p.name, p.preset_id]));

    const actions = [];
    let capacityLeft = Math.max(0, MAX_PRESETS_PER_USER - existing.length);

    for (const preset of TANK_ARCHETYPE_PRESETS) {
        const existingId = byName.get(preset.name);
        if (existingId) {
            if (args.force) {
                actions.push({ kind: 'update', preset, presetId: existingId });
            } else {
                actions.push({ kind: 'skip', preset, reason: 'уже существует' });
            }
            continue;
        }
        if (capacityLeft <= 0) {
            actions.push({
                kind: 'skip',
                preset,
                reason: `лимит пресетов (${MAX_PRESETS_PER_USER}) заполнен`
            });
            continue;
        }
        actions.push({ kind: 'insert', preset });
        capacityLeft -= 1;
    }

    const label = user.login || user.user_id;
    for (const a of actions) {
        const tag = `[${a.preset.name}]`;
        if (a.kind === 'insert') {
            await insertPreset(client, user.user_id, a.preset, args.dryRun);
            console.log(`  + добавлен ${tag}`);
        } else if (a.kind === 'update') {
            await updatePreset(client, a.presetId, a.preset, args.dryRun);
            console.log(`  ↻ обновлён ${tag}`);
        } else {
            console.log(`  · пропуск ${tag} (${a.reason})`);
        }
    }

    console.log(`[seed-test] Пресеты: готово для ${label}`);
}

async function seedPresetsBlock(client, args) {
    console.log('\n[seed-test] === Пресеты танков (архетипы) ===');
    const users = await fetchUsersForPresets(client, args.user);
    if (users.length === 0) {
        if (args.user) {
            console.error(`[seed-test] Пользователь не найден: ${args.user}`);
        } else {
            console.error('[seed-test] В БД нет пользователей — сначала создайте аккаунты или запустите --only=demo');
        }
        return;
    }

    console.log(
        `[seed-test] Пользователей для пресетов: ${users.length}${args.dryRun ? ' (dry-run)' : ''}${
            args.force ? ' (force)' : ''
        }`
    );
    for (const user of users) {
        console.log(`\n== ${user.login ?? '(без логина)'} — ${user.display_name ?? '(без имени)'} ==`);
        await seedPresetsForUser(client, user, args);
    }
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
    const args = parseArgs(process.argv);

    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
        console.error('Ошибка: задайте DATABASE_URL в server/.env или в окружении.');
        process.exit(1);
    }

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();

    const runDemo = args.only !== 'presets';
    const runPresets = args.only !== 'demo';

    try {
        if (runDemo) {
            if (args.dryRun) {
                await seedDemoBlock(client, args);
            } else {
                await client.query('BEGIN');
                try {
                    await seedDemoBlock(client, args);
                    await client.query('COMMIT');
                } catch (e) {
                    await client.query('ROLLBACK');
                    throw e;
                }
            }
        }

        if (runPresets) {
            await seedPresetsBlock(client, args);
        }

        console.log('\n[seed-test] Все запрошенные шаги завершены.');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error('[seed-test] Ошибка:', err.message || err);
    process.exit(1);
});
