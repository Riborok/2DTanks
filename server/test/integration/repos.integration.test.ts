import type { Pool } from 'pg';
import { closePool, getPool } from '../../src/db/pool';
import * as userRepo from '../../src/repos/userRepo';
import * as tankPresetRepo from '../../src/repos/tankPresetRepo';
import * as replayLikesRepo from '../../src/repos/replayLikesRepo';
import * as replayRepo from '../../src/repos/replayRepo';
import * as friendshipsRepo from '../../src/repos/friendshipsRepo';
import * as matchRepo from '../../src/repos/matchRepo';
import type { ReplayEvent, ReplayStartMeta } from '../../src/repos/replayRepo';

const hasDb = Boolean(process.env.DATABASE_URL?.trim());

type CleanupCtx = { userIds: string[]; matchIds: string[] };

async function getStandardMatchTypeId(pool: Pool): Promise<string> {
    const r = await pool.query<{ match_type_id: string }>(
        `SELECT match_type_id FROM match_types WHERE code = 'standard' LIMIT 1`
    );
    if (!r.rows[0]) {
        throw new Error('match_types.standard missing — run migrations');
    }
    return r.rows[0].match_type_id;
}

async function cleanup(pool: Pool, ctx: CleanupCtx): Promise<void> {
    if (ctx.matchIds.length > 0) {
        await pool.query(`DELETE FROM matches WHERE match_id = ANY($1::uuid[])`, [ctx.matchIds]);
    }
    if (ctx.userIds.length > 0) {
        await pool.query(
            `DELETE FROM friendships
             WHERE user_a = ANY($1::uuid[]) OR user_b = ANY($1::uuid[]) OR requested_by = ANY($1::uuid[])`,
            [ctx.userIds]
        );
        await pool.query(`DELETE FROM user_tank_presets WHERE user_id = ANY($1::uuid[])`, [ctx.userIds]);
        await pool.query(`DELETE FROM users WHERE user_id = ANY($1::uuid[])`, [ctx.userIds]);
    }
}

async function createTestUser(pool: Pool, ctx: CleanupCtx, label: string) {
    const tag = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const u = await userRepo.createUser(pool, {
        login: `repo_${label}_${tag}`,
        email: `repo_${label}_${tag}@test.local`,
        passwordHash: '$2b$10$repo_integration_placeholder_hash',
        displayName: `Repo ${label}`
    });
    ctx.userIds.push(u.user_id);
    return u;
}

(hasDb ? describe : describe.skip)('repos (PostgreSQL)', () => {
    let pool: Pool;
    const ctx: CleanupCtx = { userIds: [], matchIds: [] };

    beforeAll(() => {
        const p = getPool();
        if (!p) {
            throw new Error('pool expected when DATABASE_URL is set');
        }
        pool = p;
    });

    afterAll(async () => {
        await cleanup(pool, ctx);
        await closePool();
    });

    describe('userRepo', () => {
        it('createUser + findUserByLogin (case-insensitive) + findUserById + profile', async () => {
            const u = await createTestUser(pool, ctx, 'ur1');
            const byLogin = await userRepo.findUserByLogin(pool, u.login.toUpperCase());
            expect(byLogin?.user_id).toBe(u.user_id);
            const byId = await userRepo.findUserById(pool, u.user_id);
            expect(byId?.email).toBe(u.email);
            const prof = await userRepo.getProfileByUserId(pool, u.user_id);
            expect(prof?.user_id).toBe(u.user_id);
        });

        it('findUserByEmail is case-insensitive', async () => {
            const u = await createTestUser(pool, ctx, 'ur2');
            const row = await userRepo.findUserByEmail(pool, u.email.toUpperCase());
            expect(row?.user_id).toBe(u.user_id);
        });

        it('updateUserProfile returns false when nothing to update', async () => {
            const u = await createTestUser(pool, ctx, 'ur3');
            const ok = await userRepo.updateUserProfile(pool, u.user_id, {});
            expect(ok).toBe(false);
        });

        it('updateUserProfile sets preferredRole', async () => {
            const u = await createTestUser(pool, ctx, 'ur4');
            const ok = await userRepo.updateUserProfile(pool, u.user_id, { preferredRole: 'defender' });
            expect(ok).toBe(true);
            const prof = await userRepo.getProfileByUserId(pool, u.user_id);
            expect(prof?.preferred_role).toBe('defender');
        });

        it('findUserByLogin / findUserById return null when missing', async () => {
            expect(await userRepo.findUserByLogin(pool, `nope_${Date.now()}`)).toBeNull();
            expect(await userRepo.findUserById(pool, '00000000-0000-0000-0000-000000000001')).toBeNull();
        });

        it('updateUserProfile avatarUrl and combined avatar + role', async () => {
            const u = await createTestUser(pool, ctx, 'ur5');
            expect(await userRepo.updateUserProfile(pool, u.user_id, { avatarUrl: 'https://example.com/a.png' })).toBe(
                true
            );
            let prof = await userRepo.getProfileByUserId(pool, u.user_id);
            expect(prof?.avatar_url).toBe('https://example.com/a.png');
            expect(
                await userRepo.updateUserProfile(pool, u.user_id, {
                    avatarUrl: null,
                    preferredRole: 'attacker'
                })
            ).toBe(true);
            prof = await userRepo.getProfileByUserId(pool, u.user_id);
            expect(prof?.avatar_url).toBeNull();
            expect(prof?.preferred_role).toBe('attacker');
        });
    });

    describe('tankPresetRepo', () => {
        it('createPreset list count update delete', async () => {
            const u = await createTestUser(pool, ctx, 'tp1');
            const input = {
                name: 'Preset A',
                color: 2,
                hullNum: 1,
                trackNum: 1,
                turretNum: 1,
                weaponNum: 1
            };
            const row = await tankPresetRepo.createPreset(pool, u.user_id, input);
            expect(row.name).toBe('Preset A');
            expect(await tankPresetRepo.countPresetsForUser(pool, u.user_id)).toBe(1);
            const list = await tankPresetRepo.listPresetsForUser(pool, u.user_id);
            expect(list).toHaveLength(1);
            const upd = await tankPresetRepo.updatePreset(pool, u.user_id, row.preset_id, {
                ...input,
                name: 'Preset B',
                color: 3
            });
            expect(upd?.name).toBe('Preset B');
            expect(await tankPresetRepo.deletePreset(pool, u.user_id, row.preset_id)).toBe(true);
            expect(await tankPresetRepo.listPresetsForUser(pool, u.user_id)).toHaveLength(0);
        });

        it('deletePreset and updatePreset fail for wrong user or id', async () => {
            const owner = await createTestUser(pool, ctx, 'tp2o');
            const other = await createTestUser(pool, ctx, 'tp2x');
            const row = await tankPresetRepo.createPreset(pool, owner.user_id, {
                name: 'X',
                color: 1,
                hullNum: 1,
                trackNum: 1,
                turretNum: 1,
                weaponNum: 1
            });
            expect(await tankPresetRepo.deletePreset(pool, other.user_id, row.preset_id)).toBe(false);
            expect(
                await tankPresetRepo.updatePreset(pool, other.user_id, row.preset_id, {
                    name: 'Y',
                    color: 2,
                    hullNum: 2,
                    trackNum: 2,
                    turretNum: 2,
                    weaponNum: 2
                })
            ).toBeNull();
            expect(
                await tankPresetRepo.updatePreset(pool, owner.user_id, '00000000-0000-0000-0000-000000000001', {
                    name: 'Z',
                    color: 1,
                    hullNum: 1,
                    trackNum: 1,
                    turretNum: 1,
                    weaponNum: 1
                })
            ).toBeNull();
            expect(await tankPresetRepo.deletePreset(pool, owner.user_id, row.preset_id)).toBe(true);
        });

        it('listPresetsForUser returns newest first', async () => {
            const u = await createTestUser(pool, ctx, 'tp3');
            const base = { color: 0, hullNum: 0, trackNum: 0, turretNum: 0, weaponNum: 0 };
            await tankPresetRepo.createPreset(pool, u.user_id, { name: 'Older', ...base });
            await new Promise((r) => setTimeout(r, 5));
            await tankPresetRepo.createPreset(pool, u.user_id, { name: 'Newer', ...base });
            const list = await tankPresetRepo.listPresetsForUser(pool, u.user_id);
            expect(list.length).toBeGreaterThanOrEqual(2);
            expect(list[0].name).toBe('Newer');
        });
    });

    describe('friendshipsRepo', () => {
        it('send accept listFriends removeFriend', async () => {
            const a = await createTestUser(pool, ctx, 'fr_a');
            const b = await createTestUser(pool, ctx, 'fr_b');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, b.user_id)).toBe('ok');
            expect(await friendshipsRepo.listOutgoingRequests(pool, a.user_id)).toHaveLength(1);
            expect(await friendshipsRepo.listIncomingRequests(pool, b.user_id)).toHaveLength(1);
            expect(await friendshipsRepo.acceptFriendRequest(pool, b.user_id, a.user_id)).toBe('ok');
            expect(await friendshipsRepo.areAcceptedFriends(pool, a.user_id, b.user_id)).toBe(true);
            const friends = await friendshipsRepo.listFriends(pool, a.user_id);
            expect(friends.some((f) => f.other_user_id === b.user_id)).toBe(true);
            expect(await friendshipsRepo.removeFriend(pool, a.user_id, b.user_id)).toBe(true);
            expect(await friendshipsRepo.areAcceptedFriends(pool, a.user_id, b.user_id)).toBe(false);
        });

        it('sendFriendRequest self and user_not_found', async () => {
            const a = await createTestUser(pool, ctx, 'fr_self');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, a.user_id)).toBe('self');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, '00000000-0000-0000-0000-000000000099')).toBe(
                'user_not_found'
            );
        });

        it('blockUser unblockUser isBlockedBetween', async () => {
            const a = await createTestUser(pool, ctx, 'fr_bl_a');
            const b = await createTestUser(pool, ctx, 'fr_bl_b');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, b.user_id)).toBe('ok');
            expect(await friendshipsRepo.acceptFriendRequest(pool, b.user_id, a.user_id)).toBe('ok');
            expect(await friendshipsRepo.blockUser(pool, a.user_id, b.user_id)).toBe('ok');
            expect(await friendshipsRepo.isBlockedBetween(pool, a.user_id, b.user_id)).toBe(true);
            expect(await friendshipsRepo.unblockUser(pool, a.user_id, b.user_id)).toBe(true);
            expect(await friendshipsRepo.isBlockedBetween(pool, a.user_id, b.user_id)).toBe(false);
        });

        it('searchUsers returns [] for short query and finds by login fragment', async () => {
            const me = await createTestUser(pool, ctx, 'fr_s0');
            const other = await createTestUser(pool, ctx, 'fr_s1');
            expect(await friendshipsRepo.searchUsers(pool, me.user_id, 'x', 5)).toEqual([]);
            const needle = other.login.replace(/^repo_/, '').slice(0, 12);
            expect(needle.length).toBeGreaterThanOrEqual(2);
            const rows = await friendshipsRepo.searchUsers(pool, me.user_id, needle, 20);
            expect(rows.some((r) => r.user_id === other.user_id)).toBe(true);
        });

        it('searchUsers matches display_name', async () => {
            const me = await createTestUser(pool, ctx, 'fr_dn0');
            const other = await userRepo.createUser(pool, {
                login: `repo_fr_dn1_${Date.now()}`,
                email: `repo_fr_dn1_${Date.now()}@t.local`,
                passwordHash: 'x',
                displayName: 'UniqueDisplayRose'
            });
            ctx.userIds.push(other.user_id);
            const rows = await friendshipsRepo.searchUsers(pool, me.user_id, 'Rose', 10);
            expect(rows.some((r) => r.user_id === other.user_id)).toBe(true);
        });

        it('rejectFriendRequest removes pending', async () => {
            const a = await createTestUser(pool, ctx, 'fr_rj_a');
            const b = await createTestUser(pool, ctx, 'fr_rj_b');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, b.user_id)).toBe('ok');
            expect(await friendshipsRepo.rejectFriendRequest(pool, b.user_id, a.user_id)).toBe(true);
            expect(await friendshipsRepo.listIncomingRequests(pool, b.user_id)).toHaveLength(0);
        });

        it('sendFriendRequest already_pending', async () => {
            const a = await createTestUser(pool, ctx, 'fr_ap_a');
            const b = await createTestUser(pool, ctx, 'fr_ap_b');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, b.user_id)).toBe('ok');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, b.user_id)).toBe('already_pending');
        });

        it('counter friend request auto-accepts', async () => {
            const a = await createTestUser(pool, ctx, 'fr_cr_a');
            const b = await createTestUser(pool, ctx, 'fr_cr_b');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, b.user_id)).toBe('ok');
            expect(await friendshipsRepo.sendFriendRequest(pool, b.user_id, a.user_id)).toBe('ok');
            expect(await friendshipsRepo.areAcceptedFriends(pool, a.user_id, b.user_id)).toBe(true);
        });

        it('sendFriendRequest already_friends after acceptance', async () => {
            const a = await createTestUser(pool, ctx, 'fr_af_a');
            const b = await createTestUser(pool, ctx, 'fr_af_b');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, b.user_id)).toBe('ok');
            expect(await friendshipsRepo.acceptFriendRequest(pool, b.user_id, a.user_id)).toBe('ok');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, b.user_id)).toBe('already_friends');
        });

        it('acceptFriendRequest returns no_pending without incoming request', async () => {
            const a = await createTestUser(pool, ctx, 'fr_np_a');
            const b = await createTestUser(pool, ctx, 'fr_np_b');
            expect(await friendshipsRepo.acceptFriendRequest(pool, a.user_id, b.user_id)).toBe('no_pending');
        });

        it('listBlocked lists blocked users', async () => {
            const a = await createTestUser(pool, ctx, 'fr_lb_a');
            const b = await createTestUser(pool, ctx, 'fr_lb_b');
            expect(await friendshipsRepo.sendFriendRequest(pool, a.user_id, b.user_id)).toBe('ok');
            expect(await friendshipsRepo.acceptFriendRequest(pool, b.user_id, a.user_id)).toBe('ok');
            expect(await friendshipsRepo.blockUser(pool, a.user_id, b.user_id)).toBe('ok');
            const blocked = await friendshipsRepo.listBlocked(pool, a.user_id);
            expect(blocked.some((x) => x.other_user_id === b.user_id)).toBe(true);
        });

        it('areAcceptedFriends is false for same user', async () => {
            const a = await createTestUser(pool, ctx, 'fr_same');
            expect(await friendshipsRepo.areAcceptedFriends(pool, a.user_id, a.user_id)).toBe(false);
        });
    });

    describe('matchRepo', () => {
        const tank = { color: 0, hullNum: 0, trackNum: 0, turretNum: 0, weaponNum: 0 };

        it('createMatchWithParticipants returns null for empty players', async () => {
            expect(await matchRepo.createMatchWithParticipants(pool, { roomCode: 'E', players: [] })).toBeNull();
        });

        it('createMatchWithParticipants returns null for unknown match type', async () => {
            const u = await createTestUser(pool, ctx, 'mr_inv');
            const mid = await matchRepo.createMatchWithParticipants(pool, {
                roomCode: `INV_${Date.now()}`,
                matchTypeCode: '__no_such_type__',
                players: [{ userId: u.user_id, role: 'attacker', tankConfig: tank }]
            });
            expect(mid).toBeNull();
        });

        it('createMatchWithParticipants + finalizeMatch', async () => {
            const a = await createTestUser(pool, ctx, 'mr_a');
            const b = await createTestUser(pool, ctx, 'mr_b');
            const matchId = await matchRepo.createMatchWithParticipants(pool, {
                roomCode: `MR_${Date.now()}`,
                players: [
                    { userId: a.user_id, role: 'attacker', tankConfig: tank },
                    { userId: b.user_id, role: 'defender', tankConfig: tank }
                ]
            });
            expect(matchId).toBeTruthy();
            ctx.matchIds.push(matchId!);
            await matchRepo.finalizeMatch(pool, {
                matchId: matchId!,
                status: 'completed',
                winnerRole: 'attacker',
                endReason: 'test',
                durationTicks: 100,
                matchStats: [{ role: 'attacker', kills: 1 }]
            });
            const r = await pool.query(`SELECT match_status, winner_role FROM matches WHERE match_id = $1`, [matchId]);
            expect(r.rows[0].match_status).toBe('completed');
            expect(r.rows[0].winner_role).toBe('attacker');
        });

        it('finalizeMatch sets is_winner via winnerUserIds', async () => {
            const a = await createTestUser(pool, ctx, 'mr_wa');
            const b = await createTestUser(pool, ctx, 'mr_wb');
            const matchId = await matchRepo.createMatchWithParticipants(pool, {
                roomCode: `MW_${Date.now()}`,
                matchTypeCode: 'kill_time',
                players: [
                    { userId: a.user_id, role: 'fighter', tankConfig: tank },
                    { userId: b.user_id, role: 'fighter', tankConfig: tank }
                ]
            });
            expect(matchId).toBeTruthy();
            ctx.matchIds.push(matchId!);
            await matchRepo.finalizeMatch(pool, {
                matchId: matchId!,
                status: 'completed',
                endReason: 'arena_done',
                durationTicks: 10,
                winnerUserIds: [a.user_id]
            });
            const w = await pool.query<{ user_id: string; is_winner: boolean }>(
                `SELECT user_id, is_winner FROM match_participants WHERE match_id = $1 ORDER BY user_id`,
                [matchId]
            );
            const rowA = w.rows.find((x) => x.user_id === a.user_id);
            const rowB = w.rows.find((x) => x.user_id === b.user_id);
            expect(rowA?.is_winner).toBe(true);
            expect(rowB?.is_winner).toBe(false);
        });
    });

    describe('replayRepo + replayLikesRepo', () => {
        async function seedMatchWithReplay(opts: {
            ownerId: string;
            secondParticipantId?: string;
            isPublic: boolean;
        }) {
            const matchTypeId = await getStandardMatchTypeId(pool);
            const m = await pool.query<{ match_id: string }>(
                `INSERT INTO matches (match_id, match_type_id, room_code, match_status, ended_at, match_stats)
                 VALUES (gen_random_uuid(), $1, 'REPO', 'completed', NOW(), '[]'::jsonb)
                 RETURNING match_id`,
                [matchTypeId]
            );
            const matchId = m.rows[0].match_id;
            ctx.matchIds.push(matchId);

            await pool.query(
                `INSERT INTO match_participants (match_id, user_id, role, is_winner)
                 VALUES ($1, $2, 'attacker', true)`,
                [matchId, opts.ownerId]
            );
            if (opts.secondParticipantId) {
                await pool.query(
                    `INSERT INTO match_participants (match_id, user_id, role, is_winner)
                     VALUES ($1, $2, 'defender', false)`,
                    [matchId, opts.secondParticipantId]
                );
            }

            const r = await pool.query<{ replay_id: string }>(
                `INSERT INTO replays (match_id, created_by_user_id, title, is_public)
                 VALUES ($1, $2, 'Repo replay', $3)
                 RETURNING replay_id`,
                [matchId, opts.ownerId, opts.isPublic]
            );
            return { matchId, replayId: r.rows[0].replay_id };
        }

        it('saveMatchReplayActions + getReplayActionsForMatch', async () => {
            const owner = await createTestUser(pool, ctx, 'rp1');
            const { matchId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            const startMeta: ReplayStartMeta = {
                mode: 'standard',
                tickRate: 20,
                attackerPlayerId: owner.user_id,
                defenderPlayerId: owner.user_id,
                attackerConfig: { color: 0, hullNum: 0, trackNum: 0, turretNum: 0, weaponNum: 0 },
                defenderConfig: { color: 1, hullNum: 1, trackNum: 1, turretNum: 1, weaponNum: 1 },
                rngSeed: 42
            };
            await replayRepo.saveMatchReplayActions(pool, matchId, {
                startMeta,
                actions: [
                    {
                        tick: 0,
                        playerId: owner.user_id,
                        action: {
                            forward: true,
                            backward: false,
                            turnLeft: false,
                            turnRight: false,
                            turretLeft: false,
                            turretRight: false,
                            shoot: false
                        }
                    }
                ],
                durationTicks: 10
            });
            const loaded = await replayRepo.getReplayActionsForMatch(pool, matchId);
            expect(loaded).not.toBeNull();
            expect(loaded!.actions.length).toBeGreaterThanOrEqual(1);
        });

        it('saveMatchReplayActions with events drives actions in getReplayActionsForMatch', async () => {
            const owner = await createTestUser(pool, ctx, 'rp_ev');
            const { matchId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            const startMeta: ReplayStartMeta = {
                mode: 'standard',
                tickRate: 20,
                attackerPlayerId: owner.user_id,
                defenderPlayerId: owner.user_id,
                attackerConfig: { color: 0, hullNum: 0, trackNum: 0, turretNum: 0, weaponNum: 0 },
                defenderConfig: { color: 1, hullNum: 1, trackNum: 1, turretNum: 1, weaponNum: 1 },
                rngSeed: 1
            };
            const action = {
                forward: false,
                backward: false,
                turnLeft: false,
                turnRight: true,
                turretLeft: false,
                turretRight: false,
                shoot: false
            };
            const events: ReplayEvent[] = [
                { kind: 'player_input', tick: 2, playerId: owner.user_id, action }
            ];
            await replayRepo.saveMatchReplayActions(pool, matchId, {
                startMeta,
                actions: [],
                durationTicks: 3,
                events
            });
            const loaded = await replayRepo.getReplayActionsForMatch(pool, matchId);
            expect(loaded?.actions.some((x) => x.tick === 2 && x.action.turnRight)).toBe(true);
        });

        it('listReplaysForUser getReplayIfAllowed participant access', async () => {
            const owner = await createTestUser(pool, ctx, 'rp2o');
            const other = await createTestUser(pool, ctx, 'rp2p');
            const { matchId, replayId } = await seedMatchWithReplay({
                ownerId: owner.user_id,
                secondParticipantId: other.user_id,
                isPublic: false
            });
            const list = await replayRepo.listReplaysForUser(pool, owner.user_id);
            expect(list.some((x) => x.replay_id === replayId)).toBe(true);
            const metaOwner = await replayRepo.getReplayIfAllowed(pool, replayId, owner.user_id);
            expect(metaOwner?.replay_id).toBe(replayId);
            const metaOther = await replayRepo.getReplayIfAllowed(pool, replayId, other.user_id);
            expect(metaOther?.replay_id).toBe(replayId);
            const names = await replayRepo.listParticipantNamesForMatch(pool, matchId);
            expect(names.length).toBeGreaterThanOrEqual(2);
        });

        it('getReplayIfAllowed allows stranger on public replay', async () => {
            const owner = await createTestUser(pool, ctx, 'rp_pub_o');
            const stranger = await createTestUser(pool, ctx, 'rp_pub_s');
            const { replayId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: true });
            const meta = await replayRepo.getReplayIfAllowed(pool, replayId, stranger.user_id);
            expect(meta?.replay_id).toBe(replayId);
        });

        it('getReplayIfAllowed returns null for unknown replay', async () => {
            const u = await createTestUser(pool, ctx, 'rp_nul');
            const meta = await replayRepo.getReplayIfAllowed(
                pool,
                '00000000-0000-0000-0000-0000000000aa',
                u.user_id
            );
            expect(meta).toBeNull();
        });

        it('hasLegacyMatchReplayFrames returns boolean', async () => {
            const owner = await createTestUser(pool, ctx, 'rp3');
            const { matchId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            const legacy = await replayRepo.hasLegacyMatchReplayFrames(pool, matchId);
            expect(typeof legacy).toBe('boolean');
        });

        it('listMatchHistoryForUser', async () => {
            const owner = await createTestUser(pool, ctx, 'rp4');
            const { matchId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            const hist = await replayRepo.listMatchHistoryForUser(pool, owner.user_id, 20);
            expect(hist.some((h) => h.match_id === matchId)).toBe(true);
        });

        it('createReplaysForParticipants inserts per participant', async () => {
            const a = await createTestUser(pool, ctx, 'rp5a');
            const b = await createTestUser(pool, ctx, 'rp5b');
            const matchTypeId = await getStandardMatchTypeId(pool);
            const m = await pool.query<{ match_id: string }>(
                `INSERT INTO matches (match_id, match_type_id, room_code, match_status, ended_at)
                 VALUES (gen_random_uuid(), $1, 'RP5', 'completed', NOW())
                 RETURNING match_id`,
                [matchTypeId]
            );
            const matchId = m.rows[0].match_id;
            ctx.matchIds.push(matchId);
            await pool.query(
                `INSERT INTO match_participants (match_id, user_id, role, is_winner) VALUES ($1, $2, 'attacker', true), ($1, $3, 'defender', false)`,
                [matchId, a.user_id, b.user_id]
            );
            await replayRepo.createReplaysForParticipants(pool, matchId);
            const cnt = await pool.query<{ c: string }>(
                `SELECT COUNT(*)::text AS c FROM replays WHERE match_id = $1`,
                [matchId]
            );
            expect(Number(cnt.rows[0].c)).toBe(2);
        });

        it('updateReplayMeta rejects empty title', async () => {
            const owner = await createTestUser(pool, ctx, 'rp6');
            const { replayId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            const bad = await replayRepo.updateReplayMeta(pool, replayId, owner.user_id, { title: '   ' });
            expect(bad).toBe(false);
        });

        it('updateReplayMeta updates title and isPublic', async () => {
            const owner = await createTestUser(pool, ctx, 'rp_um');
            const { replayId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            const ok = await replayRepo.updateReplayMeta(pool, replayId, owner.user_id, {
                title: '  New title  ',
                isPublic: true
            });
            expect(ok).toBe(true);
            const r = await pool.query<{ title: string; is_public: boolean }>(
                `SELECT title, is_public FROM replays WHERE replay_id = $1`,
                [replayId]
            );
            expect(r.rows[0].title).toBe('New title');
            expect(r.rows[0].is_public).toBe(true);
        });

        it('ensureReplaySharedSlug returns null for non-owner', async () => {
            const owner = await createTestUser(pool, ctx, 'rp_so');
            const other = await createTestUser(pool, ctx, 'rp_sx');
            const { replayId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            expect(await replayRepo.ensureReplaySharedSlug(pool, replayId, other.user_id)).toBeNull();
        });

        it('revokeReplaySharedSlug returns false for non-owner', async () => {
            const owner = await createTestUser(pool, ctx, 'rp_ro');
            const other = await createTestUser(pool, ctx, 'rp_rx');
            const { replayId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: true });
            await replayRepo.ensureReplaySharedSlug(pool, replayId, owner.user_id);
            expect(await replayRepo.revokeReplaySharedSlug(pool, replayId, other.user_id)).toBe(false);
        });

        it('enrichMatchStatsDisplayNames fills displayName from participants', async () => {
            const owner = await createTestUser(pool, ctx, 'rp7');
            const { matchId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            const out = await replayRepo.enrichMatchStatsDisplayNames(pool, matchId, [
                { role: 'attacker', displayName: '' }
            ]);
            expect(Array.isArray(out)).toBe(true);
            const first = out[0] as { displayName?: string };
            expect(typeof first.displayName).toBe('string');
            expect(first.displayName!.length).toBeGreaterThan(0);
        });

        it('enrichMatchStatsDisplayNames handles empty and preserves filled displayName', async () => {
            const owner = await createTestUser(pool, ctx, 'rp_en');
            const { matchId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            expect(await replayRepo.enrichMatchStatsDisplayNames(pool, matchId, [])).toEqual([]);
            const raw = { role: 'attacker', displayName: 'Already' };
            const out = await replayRepo.enrichMatchStatsDisplayNames(pool, matchId, [raw]);
            expect(out[0]).toBe(raw);
            const mixed = await replayRepo.enrichMatchStatsDisplayNames(pool, matchId, [
                null,
                'x',
                { role: 'defender', displayName: '' }
            ] as unknown[]);
            expect(mixed[0]).toBeNull();
            expect(mixed[1]).toBe('x');
        });

        it('likeReplay getLikeInfo unlikeReplay on public replay', async () => {
            const owner = await createTestUser(pool, ctx, 'rp8');
            const liker = await createTestUser(pool, ctx, 'rp8b');
            const { replayId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: true });
            expect(await replayLikesRepo.likeReplay(pool, replayId, liker.user_id)).toBe('ok');
            expect(await replayLikesRepo.likeReplay(pool, replayId, liker.user_id)).toBe('ok');
            const info = await replayLikesRepo.getLikeInfo(pool, replayId, liker.user_id);
            expect(info.likedByMe).toBe(true);
            expect(info.likeCount).toBeGreaterThanOrEqual(1);
            await replayLikesRepo.unlikeReplay(pool, replayId, liker.user_id);
            const after = await replayLikesRepo.getLikeInfo(pool, replayId, liker.user_id);
            expect(after.likedByMe).toBe(false);
        });

        it('likeReplay returns not_public for private replay', async () => {
            const owner = await createTestUser(pool, ctx, 'rp9');
            const { replayId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            expect(await replayLikesRepo.likeReplay(pool, replayId, owner.user_id)).toBe('not_public');
        });

        it('ensureReplaySharedSlug getReplayBySharedSlug revokeReplaySharedSlug', async () => {
            const owner = await createTestUser(pool, ctx, 'rp10');
            const { replayId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: false });
            const slug = await replayRepo.ensureReplaySharedSlug(pool, replayId, owner.user_id);
            expect(slug).toBeTruthy();
            const row = await replayRepo.getReplayBySharedSlug(pool, slug!);
            expect(row?.replay_id).toBe(replayId);
            expect(await replayRepo.revokeReplaySharedSlug(pool, replayId, owner.user_id)).toBe(true);
            expect(await replayRepo.getReplayBySharedSlug(pool, slug!)).toBeNull();
        });

        it('listPublicReplays returns rows', async () => {
            const owner = await createTestUser(pool, ctx, 'rp11');
            await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: true });
            const rows = await replayLikesRepo.listPublicReplays(pool, null, { limit: 5, offset: 0, sort: 'new' });
            expect(Array.isArray(rows)).toBe(true);
        });

        it('listPublicReplays sort top and liked_by_me for viewer', async () => {
            const owner = await createTestUser(pool, ctx, 'rp12o');
            const viewer = await createTestUser(pool, ctx, 'rp12v');
            const { replayId } = await seedMatchWithReplay({ ownerId: owner.user_id, isPublic: true });
            await replayLikesRepo.likeReplay(pool, replayId, viewer.user_id);
            const top = await replayLikesRepo.listPublicReplays(pool, viewer.user_id, {
                limit: 20,
                offset: 0,
                sort: 'top'
            });
            const row = top.find((x) => x.replay_id === replayId);
            expect(row?.liked_by_me).toBe(true);
            expect(row?.like_count).toBeGreaterThanOrEqual(1);
        });
    });
});
