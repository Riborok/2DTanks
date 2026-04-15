import { Router, type Response } from 'express';
import { getPool } from '../db/pool';
import { requireBearerAuth } from '../auth/httpAuth';
import * as replayRepo from '../repos/replayRepo';
const router = Router();
router.use(requireBearerAuth);

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
            events: replayData.events ?? []
        });
    } catch (e) {
        console.error('[game/replays/playback]', e);
        res.status(500).json({ error: 'Ошибка загрузки записи' });
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
        res.json({
            matches: rows.map((m) => ({
                matchId: m.match_id,
                roomCode: m.room_code,
                matchStatus: m.match_status,
                winnerRole: m.winner_role,
                endReason: m.end_reason,
                durationTicks: m.duration_ticks,
                startedAt: m.started_at,
                endedAt: m.ended_at,
                role: m.participant_role,
                isWinner: m.is_winner
            }))
        });
    } catch (e) {
        console.error('[game/matches/history]', e);
        res.status(500).json({ error: 'Ошибка истории матчей' });
    }
});

export default router;
