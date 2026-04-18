import { useEffect, useRef, useState } from 'react';
import { GameWorldSnapshot, ServerTank } from '../../online/types';

/**
 * События HUD, которые мы извлекаем из diff-а снапшотов без изменений серверного
 * протокола: попадания (изменения HP), убийства (переход HP > 0 → HP ≤ 0)
 * и прилёты взрывов/пуль (через bulletImpacts/explosions из снапшота).
 *
 * Это даёт синхронный kill-feed, floating damage numbers и источник для звуков
 * без дополнительных полей в снапшоте. Детерминизм не страдает: всё считается
 * на клиенте по тем же снапшотам, что сервер и так рассылает.
 */

export interface HitEvent {
    id: number;
    targetId: string;
    x: number;
    y: number;
    dmg: number;
    dir: number;
    createdAt: number;
    /** Чтобы не дублировать звук/вибрацию — помечаем уже «съеденные» эффекты */
    consumed?: boolean;
}

export interface KillEvent {
    id: number;
    killerId: string | null;
    killerName: string;
    victimId: string;
    victimName: string;
    weaponNum: number;
    createdAt: number;
}

export interface DamageTakenEvent {
    id: number;
    /** Угол от своего танка к источнику урона в мировых координатах (для дуги) */
    worldAngle: number;
    dmg: number;
    createdAt: number;
}

export interface HudEventsState {
    hits: HitEvent[];
    kills: KillEvent[];
    damageTaken: DamageTakenEvent[];
}

let _id = 1;
const nextId = () => _id++;

interface Options {
    myPlayerId: string;
    playerNameById: Map<string, string>;
    onNewExplosion?: (x: number, y: number) => void;
    onNewBulletImpact?: (x: number, y: number) => void;
    onOwnShot?: () => void;
    onOwnDamage?: (dmg: number) => void;
    onTankKilled?: (tank: ServerTank) => void;
}

export function useHudEvents(snapshotRef: React.MutableRefObject<GameWorldSnapshot | null>, opts: Options) {
    const [state, setState] = useState<HudEventsState>({ hits: [], kills: [], damageTaken: [] });
    const prevTanksRef = useRef<Map<string, ServerTank>>(new Map());
    const prevBulletCountByTankRef = useRef<Map<string, number>>(new Map());
    const explosionsSeenRef = useRef<Set<string>>(new Set());
    const impactsSeenRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const KEEP_HIT_MS = 900;
        const KEEP_KILL_MS = 5000;
        const KEEP_DMG_MS = 1200;

        const loop = () => {
            const snap = snapshotRef.current;
            const now = performance.now();
            if (snap) {
                const newHits: HitEvent[] = [];
                const newKills: KillEvent[] = [];
                const newDamageTaken: DamageTakenEvent[] = [];

                const prev = prevTanksRef.current;
                const currMap = new Map<string, ServerTank>();
                const myTank = snap.tanks.find((t) => t.playerId === opts.myPlayerId) || null;

                for (const t of snap.tanks) {
                    currMap.set(t.id, t);
                    const p = prev.get(t.id);
                    if (p) {
                        const dmg = p.health - t.health;
                        if (dmg > 0.5 && t.health > 0) {
                            newHits.push({
                                id: nextId(),
                                targetId: t.id,
                                x: t.x,
                                y: t.y,
                                dmg: Math.round(dmg),
                                dir: 0,
                                createdAt: now
                            });
                            if (t.playerId === opts.myPlayerId && myTank) {
                                // Угол «откуда прилетело» — ищем ближайший снаряд противника.
                                // Приближение: берём вектор от своего танка к ближайшему чужому.
                                let minDist = Infinity;
                                let attackerAngle = 0;
                                for (const ot of snap.tanks) {
                                    if (ot.id === t.id) continue;
                                    const d = Math.hypot(ot.x - t.x, ot.y - t.y);
                                    if (d < minDist) {
                                        minDist = d;
                                        attackerAngle = Math.atan2(ot.y - t.y, ot.x - t.x);
                                    }
                                }
                                newDamageTaken.push({
                                    id: nextId(),
                                    worldAngle: attackerAngle,
                                    dmg: Math.round(dmg),
                                    createdAt: now
                                });
                                opts.onOwnDamage?.(dmg);
                            }
                        }
                        if (p.health > 0 && t.health <= 0) {
                            newKills.push({
                                id: nextId(),
                                killerId: null,
                                killerName: '—',
                                victimId: t.id,
                                victimName: opts.playerNameById.get(t.playerId || '') || 'Игрок',
                                weaponNum: t.weaponNum,
                                createdAt: now
                            });
                            opts.onTankKilled?.(t);
                        }
                    }
                }
                prevTanksRef.current = currMap;

                if (snap.explosions) {
                    for (const ex of snap.explosions) {
                        const k = `${ex.x}|${ex.y}|${ex.angle}`;
                        if (!explosionsSeenRef.current.has(k)) {
                            explosionsSeenRef.current.add(k);
                            opts.onNewExplosion?.(ex.x, ex.y);
                        }
                    }
                    if (explosionsSeenRef.current.size > 1024) {
                        explosionsSeenRef.current.clear();
                    }
                }
                if (snap.bulletImpacts) {
                    for (const im of snap.bulletImpacts) {
                        const k = `${im.x}|${im.y}|${im.angle}`;
                        if (!impactsSeenRef.current.has(k)) {
                            impactsSeenRef.current.add(k);
                            opts.onNewBulletImpact?.(im.x, im.y);
                        }
                    }
                    if (impactsSeenRef.current.size > 1024) {
                        impactsSeenRef.current.clear();
                    }
                }

                // Отслеживание собственного выстрела: считаем пули в мире. Если
                // количество пуль в кадре выросло и недавно стреляли — это наш shot.
                // Точность пригодна только для аудио/хаптики, не для логики.
                const ownBullets = snap.bullets.length;
                const prevOwnBullets = prevBulletCountByTankRef.current.get(opts.myPlayerId) ?? ownBullets;
                if (ownBullets > prevOwnBullets) {
                    opts.onOwnShot?.();
                }
                prevBulletCountByTankRef.current.set(opts.myPlayerId, ownBullets);

                if (newHits.length || newKills.length || newDamageTaken.length) {
                    setState((prevState) => ({
                        hits: [...prevState.hits.filter((h) => now - h.createdAt < KEEP_HIT_MS), ...newHits],
                        kills: [...prevState.kills.filter((k) => now - k.createdAt < KEEP_KILL_MS), ...newKills].slice(-6),
                        damageTaken: [
                            ...prevState.damageTaken.filter((d) => now - d.createdAt < KEEP_DMG_MS),
                            ...newDamageTaken
                        ]
                    }));
                } else {
                    // Чистим устаревшее
                    setState((prevState) => {
                        const hits = prevState.hits.filter((h) => now - h.createdAt < KEEP_HIT_MS);
                        const kills = prevState.kills.filter((k) => now - k.createdAt < KEEP_KILL_MS);
                        const damageTaken = prevState.damageTaken.filter((d) => now - d.createdAt < KEEP_DMG_MS);
                        if (
                            hits.length === prevState.hits.length &&
                            kills.length === prevState.kills.length &&
                            damageTaken.length === prevState.damageTaken.length
                        ) {
                            return prevState;
                        }
                        return { hits, kills, damageTaken };
                    });
                }
            }

            raf = requestAnimationFrame(loop);
        };

        let raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opts.myPlayerId]);

    return state;
}
