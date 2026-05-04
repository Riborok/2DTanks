import { Router, type Response } from 'express';
import { getPool } from '../db/pool';
import * as replayRepo from '../repos/replayRepo';
import * as replayLikesRepo from '../repos/replayLikesRepo';

const router = Router();

function noDb(res: Response): boolean {
    if (!getPool()) {
        res.status(503).json({ error: 'База данных не настроена' });
        return true;
    }
    return false;
}

/**
 * Публичный эндпоинт: отдаёт playback реплея по короткому slug без авторизации,
 * но только если владелец явно включил шеринг (is_public = TRUE и есть shared_slug).
 * Клиент страницы /s/:slug использует именно этот маршрут.
 */
router.get('/replays/by-slug/:slug/playback', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const slug = String(req.params.slug || '');
    try {
        const meta = await replayRepo.getReplayBySharedSlug(pool, slug);
        if (!meta) {
            res.status(404).json({ error: 'Реплей не найден или доступ отозван' });
            return;
        }
        const replayData = await replayRepo.getReplayActionsForMatch(pool, meta.match_id);
        if (!replayData) {
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
        console.error('[public/replays/by-slug]', e);
        res.status(500).json({ error: 'Ошибка загрузки записи' });
    }
});

/**
 * Публичная галерея: список публичных реплеев с пагинацией и сортировкой.
 * Лайки можно видеть без авторизации (likedByMe = false, когда меId = null).
 */
router.get('/gallery', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query?.limit ?? '30'), 10) || 30));
    const offset = Math.max(0, parseInt(String(req.query?.offset ?? '0'), 10) || 0);
    const sort = req.query?.sort === 'top' ? 'top' : 'new';
    try {
        const rows = await replayLikesRepo.listPublicReplays(pool, null, { limit, offset, sort });
        res.json({
            replays: rows.map((r) => ({
                replayId: r.replay_id,
                matchId: r.match_id,
                title: r.title,
                slug: r.shared_slug,
                ownerDisplayName: r.owner_display_name,
                createdAt: r.created_at,
                endedAt: r.ended_at,
                roomCode: r.room_code,
                winnerRole: r.winner_role,
                matchStatus: r.match_status,
                durationTicks: r.duration_ticks,
                likeCount: Number(r.like_count ?? 0),
                likedByMe: Boolean(r.liked_by_me)
            }))
        });
    } catch (e) {
        console.error('[public/gallery]', e);
        res.status(500).json({ error: 'Ошибка загрузки галереи' });
    }
});

/**
 * Публичная статистика матча по реплею из галереи (только is_public).
 */
router.get('/gallery/replay/:replayId/stats', async (req, res) => {
    if (noDb(res)) return;
    const pool = getPool()!;
    const replayId = String(req.params.replayId || '').trim();
    if (!replayId) {
        res.status(400).json({ error: 'Не указан реплей' });
        return;
    }
    try {
        const row = await replayRepo.getMatchStatsForPublicReplay(pool, replayId);
        if (!row) {
            res.status(404).json({ error: 'Реплей не найден или не публичный' });
            return;
        }
        res.json({
            matchId: row.match_id,
            roomCode: row.room_code,
            matchStats: row.match_stats
        });
    } catch (e) {
        console.error('[public/gallery/replay/stats]', e);
        res.status(500).json({ error: 'Ошибка загрузки статистики' });
    }
});

export default router;
