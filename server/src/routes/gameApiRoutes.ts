import { Router, type Response } from 'express';
import { getPool } from '../db/pool';
import { requireBearerAuth } from '../auth/httpAuth';
import * as replayRepo from '../repos/replayRepo';
import * as tankPresetRepo from '../repos/tankPresetRepo';
import * as friendshipsRepo from '../repos/friendshipsRepo';
import * as replayLikesRepo from '../repos/replayLikesRepo';
import { notifyUserSockets } from '../ws/userSocketRegistry';
import * as userRepo from '../repos/userRepo';
const router = Router();
router.use(requireBearerAuth);

function mapPresetRow(row: tankPresetRepo.TankPresetRow) {
    return {
        presetId: row.preset_id,
        name: row.name,
        color: row.tank_color,
        hullNum: row.tank_hull_num,
        trackNum: row.tank_track_num,
        turretNum: row.tank_turret_num,
        weaponNum: row.tank_weapon_num,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function parsePresetPayload(body: unknown):
    | { ok: true; value: tankPresetRepo.TankPresetInput }
    | { ok: false; message: string } {
    if (!body || typeof body !== 'object') {
        return { ok: false as const, message: 'Некорректные данные' };
    }
    const raw = body as Record<string, unknown>;
    const nameInput = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (nameInput.length === 0) {
        return { ok: false as const, message: 'Название обязательно' };
    }
    if (nameInput.length > tankPresetRepo.PRESET_NAME_MAX_LEN) {
        return { ok: false as const, message: `Название длиннее ${tankPresetRepo.PRESET_NAME_MAX_LEN} символов` };
    }
    const nums: Record<string, number> = {};
    for (const key of ['color', 'hullNum', 'trackNum', 'turretNum', 'weaponNum'] as const) {
        const v = raw[key];
        if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 15) {
            return { ok: false as const, message: `Некорректное поле ${key}` };
        }
        nums[key] = v;
    }
    return {
        ok: true as const,
        value: {
            name: nameInput,
            color: nums.color,
            hullNum: nums.hullNum,
            trackNum: nums.trackNum,
            turretNum: nums.turretNum,
            weaponNum: nums.weaponNum
        }
    };
}

function noDb(res: Response): boolean {
    if (!getPool()) {
        res.status(503).json({ error: 'База данных не настроена' });
        return true;
    }
    return false;
}

router.get('/replays', async (req, res) => {
    if (noDb(res)) {
        return;
    }
    const pool = getPool()!;
    try {
        const rows = await replayRepo.listReplaysForUser(pool, req.auth!.sub);
        res.json({
            replays: rows.map((r) => ({
                replayId: r.replay_id,
                matchId: r.match_id,
                title: r.title,
                isPublic: r.is_public,
                createdAt: r.created_at,
                endedAt: r.ended_at,
                roomCode: r.room_code,
                winnerRole: r.winner_role,
                matchStatus: r.match_status
            }))
        });
    } catch (e) {
        console.error('[game/replays]', e);
        res.status(500).json({ error: 'Ошибка загрузки реплеев' });
    }
});

router.get('/replays/:replayId/playback', async (req, res) => {
    if (noDb(res)) {
        return;
    }
    const pool = getPool()!;
    const replayId = String(req.params.replayId || '');
    try {
        const meta = await replayRepo.getReplayIfAllowed(pool, replayId, req.auth!.sub);
        if (!meta) {
            res.status(404).json({ error: 'Реплей не найден или нет доступа' });
            return;
        }
        const replayData = await replayRepo.getReplayActionsForMatch(pool, meta.match_id);
        if (!replayData) {
            const legacy = await replayRepo.hasLegacyMatchReplayFrames(pool, meta.match_id);
            if (legacy) {
                res.status(410).json({ error: 'Старый формат реплея не поддерживается' });
                return;
            }
            res.status(404).json({ error: 'Действия реплея не найдены' });
            return;
        }
        const participants = await replayRepo.listParticipantNamesForMatch(pool, meta.match_id);
        const sm = replayData.startMeta;
        let playerNames: Record<string, string> = {};
        if (sm.mode === 'standard') {
            const attackerName = participants.find((p) => p.role === 'attacker')?.display_name ?? 'Attacker';
            const defenderName = participants.find((p) => p.role === 'defender')?.display_name ?? 'Defender';
            playerNames = {
                [sm.attackerPlayerId]: attackerName,
                [sm.defenderPlayerId]: defenderName
            };
        } else {
            for (let i = 0; i < sm.fighters.length; i++) {
                const pid = sm.fighters[i].playerId;
                const nm = participants[i]?.display_name?.trim();
                playerNames[pid] = nm && nm.length > 0 ? nm : `Игрок ${i + 1}`;
            }
        }
        res.json({
            meta: {
                replayId: meta.replay_id,
                matchId: meta.match_id,
                title: meta.title,
                isPublic: meta.is_public,
                roomCode: meta.room_code,
                winnerRole: meta.winner_role,
                matchStatus: meta.match_status,
                endReason: meta.end_reason,
                durationTicks: meta.duration_ticks,
                endedAt: meta.ended_at
            },
            startMeta: replayData.startMeta,
            actions: replayData.actions,
            events: replayData.events ?? [],
            playerNames
        });
    } catch (e) {
        console.error('[game/replays/playback]', e);
        res.status(500).json({ error: 'Ошибка загрузки записи' });
    }
});

router.post('/replays/:replayId/share', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const replayId = String(req.params.replayId || '');
    try {
        const slug = await replayRepo.ensureReplaySharedSlug(pool, replayId, req.auth!.sub);
        if (!slug) {
            res.status(404).json({ error: 'Реплей не найден' });
            return;
        }
        res.json({ slug });
    } catch (e) {
        console.error('[game/replays share]', e);
        res.status(500).json({ error: 'Не удалось создать ссылку' });
    }
});

router.delete('/replays/:replayId/share', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const replayId = String(req.params.replayId || '');
    try {
        const ok = await replayRepo.revokeReplaySharedSlug(pool, replayId, req.auth!.sub);
        if (!ok) {
            res.status(404).json({ error: 'Реплей не найден' });
            return;
        }
        res.json({ ok: true });
    } catch (e) {
        console.error('[game/replays share revoke]', e);
        res.status(500).json({ error: 'Не удалось отозвать ссылку' });
    }
});

router.patch('/replays/:replayId', async (req, res) => {
    if (noDb(res)) {
        return;
    }
    const pool = getPool()!;
    const replayId = String(req.params.replayId || '');
    const title = req.body?.title !== undefined ? String(req.body.title) : undefined;
    const isPublic = req.body?.isPublic;
    const publicBool =
        typeof isPublic === 'boolean'
            ? isPublic
            : isPublic === undefined
              ? undefined
              : Boolean(isPublic);
    if (title === undefined && publicBool === undefined) {
        res.status(400).json({ error: 'Укажите title и/или isPublic' });
        return;
    }
    try {
        const ok = await replayRepo.updateReplayMeta(pool, replayId, req.auth!.sub, {
            title,
            isPublic: publicBool
        });
        if (!ok) {
            res.status(404).json({ error: 'Реплей не найден' });
            return;
        }
        res.json({ ok: true });
    } catch (e) {
        console.error('[game/replays patch]', e);
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

router.get('/matches/history', async (req, res) => {
    if (noDb(res)) {
        return;
    }
    const pool = getPool()!;
    try {
        const rows = await replayRepo.listMatchHistoryForUser(pool, req.auth!.sub);
        const matches = await Promise.all(
            rows.map(async (m) => ({
                matchId: m.match_id,
                roomCode: m.room_code,
                matchStatus: m.match_status,
                winnerRole: m.winner_role,
                endReason: m.end_reason,
                durationTicks: m.duration_ticks,
                startedAt: m.started_at,
                endedAt: m.ended_at,
                role: m.participant_role,
                isWinner: m.is_winner,
                matchStats: await replayRepo.enrichMatchStatsDisplayNames(
                    pool,
                    m.match_id,
                    Array.isArray(m.match_stats) ? m.match_stats : []
                )
            }))
        );
        res.json({ matches });
    } catch (e) {
        console.error('[game/matches/history]', e);
        res.status(500).json({ error: 'Ошибка истории матчей' });
    }
});

router.get('/tank-presets', async (req, res) => {
    if (noDb(res)) {
        return;
    }
    const pool = getPool()!;
    try {
        const rows = await tankPresetRepo.listPresetsForUser(pool, req.auth!.sub);
        res.json({ presets: rows.map(mapPresetRow) });
    } catch (e) {
        console.error('[game/tank-presets list]', e);
        res.status(500).json({ error: 'Ошибка загрузки сетов' });
    }
});

router.post('/tank-presets', async (req, res) => {
    if (noDb(res)) {
        return;
    }
    const pool = getPool()!;
    const parsed = parsePresetPayload(req.body);
    if (parsed.ok === false) {
        res.status(400).json({ error: parsed.message });
        return;
    }
    try {
        const count = await tankPresetRepo.countPresetsForUser(pool, req.auth!.sub);
        if (count >= tankPresetRepo.MAX_PRESETS_PER_USER) {
            res.status(400).json({
                error: `Достигнут лимит сохранённых сетов (${tankPresetRepo.MAX_PRESETS_PER_USER})`
            });
            return;
        }
        const created = await tankPresetRepo.createPreset(pool, req.auth!.sub, parsed.value);
        res.status(201).json({ preset: mapPresetRow(created) });
    } catch (e) {
        console.error('[game/tank-presets create]', e);
        res.status(500).json({ error: 'Не удалось сохранить сет' });
    }
});

router.put('/tank-presets/:presetId', async (req, res) => {
    if (noDb(res)) {
        return;
    }
    const pool = getPool()!;
    const presetId = String(req.params.presetId || '');
    const parsed = parsePresetPayload(req.body);
    if (parsed.ok === false) {
        res.status(400).json({ error: parsed.message });
        return;
    }
    try {
        const row = await tankPresetRepo.updatePreset(pool, req.auth!.sub, presetId, parsed.value);
        if (!row) {
            res.status(404).json({ error: 'Сет не найден' });
            return;
        }
        res.json({ preset: mapPresetRow(row) });
    } catch (e) {
        console.error('[game/tank-presets update]', e);
        res.status(500).json({ error: 'Не удалось обновить сет' });
    }
});

router.delete('/tank-presets/:presetId', async (req, res) => {
    if (noDb(res)) {
        return;
    }
    const pool = getPool()!;
    const presetId = String(req.params.presetId || '');
    try {
        const ok = await tankPresetRepo.deletePreset(pool, req.auth!.sub, presetId);
        if (!ok) {
            res.status(404).json({ error: 'Сет не найден' });
            return;
        }
        res.json({ ok: true });
    } catch (e) {
        console.error('[game/tank-presets delete]', e);
        res.status(500).json({ error: 'Не удалось удалить сет' });
    }
});

// ===== FRIENDS =====

function mapFriendRow(row: friendshipsRepo.FriendRow) {
    return {
        userId: row.other_user_id,
        login: row.other_login,
        displayName: row.other_display_name,
        status: row.status,
        requestedByMe: row.requested_by_me,
        createdAt: row.created_at
    };
}

router.get('/friends', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    try {
        const [friends, incoming, outgoing, blocked] = await Promise.all([
            friendshipsRepo.listFriends(pool, req.auth!.sub),
            friendshipsRepo.listIncomingRequests(pool, req.auth!.sub),
            friendshipsRepo.listOutgoingRequests(pool, req.auth!.sub),
            friendshipsRepo.listBlocked(pool, req.auth!.sub)
        ]);
        res.json({
            friends: friends.map(mapFriendRow),
            incoming: incoming.map(mapFriendRow),
            outgoing: outgoing.map(mapFriendRow),
            blocked: blocked.map(mapFriendRow)
        });
    } catch (e) {
        console.error('[game/friends list]', e);
        res.status(500).json({ error: 'Ошибка загрузки друзей' });
    }
});

router.post('/friends/request', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const targetId = String(req.body?.userId || '').trim();
    if (!targetId) {
        res.status(400).json({ error: 'Не указан пользователь' });
        return;
    }
    try {
        const result = await friendshipsRepo.sendFriendRequest(pool, req.auth!.sub, targetId);
        if (result === 'user_not_found') {
            res.status(404).json({ error: 'Пользователь не найден' });
            return;
        }
        if (result === 'self') {
            res.status(400).json({ error: 'Нельзя добавить себя' });
            return;
        }
        if (result === 'blocked') {
            res.status(403).json({ error: 'Этот пользователь недоступен' });
            return;
        }
        if (result === 'ok') {
            const mutual = await friendshipsRepo.areAcceptedFriends(pool, req.auth!.sub, targetId);
            if (mutual) {
                const peerRow = await userRepo.findUserById(pool, targetId);
                notifyUserSockets(targetId, {
                    type: 'friends:became_friends',
                    peerUserId: req.auth!.sub,
                    peerLogin: req.auth!.login,
                    peerDisplayName: req.auth!.displayName
                });
                notifyUserSockets(req.auth!.sub, {
                    type: 'friends:became_friends',
                    peerUserId: targetId,
                    peerLogin: peerRow?.login ?? '',
                    peerDisplayName: peerRow?.display_name ?? ''
                });
            } else {
                notifyUserSockets(targetId, {
                    type: 'friends:incoming',
                    fromUserId: req.auth!.sub,
                    fromLogin: req.auth!.login,
                    fromDisplayName: req.auth!.displayName
                });
            }
        }
        res.json({ ok: true, status: result });
    } catch (e) {
        console.error('[game/friends request]', e);
        res.status(500).json({ error: 'Не удалось отправить запрос' });
    }
});

router.post('/friends/accept', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const other = String(req.body?.userId || '').trim();
    if (!other) {
        res.status(400).json({ error: 'Не указан пользователь' });
        return;
    }
    try {
        const r = await friendshipsRepo.acceptFriendRequest(pool, req.auth!.sub, other);
        if (r === 'no_pending') {
            res.status(404).json({ error: 'Нет входящего запроса' });
            return;
        }
        // `other` — отправитель заявки: уведомляем, что её приняли.
        notifyUserSockets(other, {
            type: 'friends:accepted',
            friendUserId: req.auth!.sub,
            friendLogin: req.auth!.login,
            friendDisplayName: req.auth!.displayName
        });
        // Принявший тоже получает push — список друзей обновится без перезагрузки.
        const otherRow = await userRepo.findUserById(pool, other);
        notifyUserSockets(req.auth!.sub, {
            type: 'friends:you_accepted',
            friendUserId: other,
            friendLogin: otherRow?.login ?? '',
            friendDisplayName: otherRow?.display_name ?? ''
        });
        res.json({ ok: true });
    } catch (e) {
        console.error('[game/friends accept]', e);
        res.status(500).json({ error: 'Ошибка принятия запроса' });
    }
});

router.post('/friends/reject', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const other = String(req.body?.userId || '').trim();
    if (!other) {
        res.status(400).json({ error: 'Не указан пользователь' });
        return;
    }
    try {
        const ok = await friendshipsRepo.rejectFriendRequest(pool, req.auth!.sub, other);
        res.json({ ok });
    } catch (e) {
        console.error('[game/friends reject]', e);
        res.status(500).json({ error: 'Ошибка отклонения запроса' });
    }
});

router.post('/friends/remove', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const other = String(req.body?.userId || '').trim();
    if (!other) {
        res.status(400).json({ error: 'Не указан пользователь' });
        return;
    }
    try {
        const ok = await friendshipsRepo.removeFriend(pool, req.auth!.sub, other);
        res.json({ ok });
    } catch (e) {
        console.error('[game/friends remove]', e);
        res.status(500).json({ error: 'Ошибка удаления' });
    }
});

router.post('/friends/block', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const other = String(req.body?.userId || '').trim();
    if (!other) {
        res.status(400).json({ error: 'Не указан пользователь' });
        return;
    }
    try {
        const r = await friendshipsRepo.blockUser(pool, req.auth!.sub, other);
        if (r === 'self') {
            res.status(400).json({ error: 'Нельзя заблокировать себя' });
            return;
        }
        res.json({ ok: true });
    } catch (e) {
        console.error('[game/friends block]', e);
        res.status(500).json({ error: 'Ошибка блокировки' });
    }
});

router.post('/friends/unblock', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const other = String(req.body?.userId || '').trim();
    if (!other) {
        res.status(400).json({ error: 'Не указан пользователь' });
        return;
    }
    try {
        const ok = await friendshipsRepo.unblockUser(pool, req.auth!.sub, other);
        res.json({ ok });
    } catch (e) {
        console.error('[game/friends unblock]', e);
        res.status(500).json({ error: 'Ошибка разблокировки' });
    }
});

router.get('/users/search', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const q = String(req.query?.q || '').trim();
    if (q.length < 2) {
        res.json({ users: [] });
        return;
    }
    try {
        const rows = await friendshipsRepo.searchUsers(pool, req.auth!.sub, q, 20);
        res.json({
            users: rows.map((u) => ({
                userId: u.user_id,
                login: u.login,
                displayName: u.display_name
            }))
        });
    } catch (e) {
        console.error('[game/users/search]', e);
        res.status(500).json({ error: 'Ошибка поиска' });
    }
});

// ===== REPLAY LIKES / GALLERY =====

router.post('/replays/:replayId/like', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const replayId = String(req.params.replayId || '');
    try {
        const r = await replayLikesRepo.likeReplay(pool, replayId, req.auth!.sub);
        if (r === 'not_public') {
            res.status(403).json({ error: 'Реплей не публичный' });
            return;
        }
        const info = await replayLikesRepo.getLikeInfo(pool, replayId, req.auth!.sub);
        res.json({ ok: true, ...info });
    } catch (e) {
        console.error('[game/replays like]', e);
        res.status(500).json({ error: 'Ошибка лайка' });
    }
});

router.delete('/replays/:replayId/like', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const replayId = String(req.params.replayId || '');
    try {
        await replayLikesRepo.unlikeReplay(pool, replayId, req.auth!.sub);
        const info = await replayLikesRepo.getLikeInfo(pool, replayId, req.auth!.sub);
        res.json({ ok: true, ...info });
    } catch (e) {
        console.error('[game/replays unlike]', e);
        res.status(500).json({ error: 'Ошибка удаления лайка' });
    }
});

export default router;
