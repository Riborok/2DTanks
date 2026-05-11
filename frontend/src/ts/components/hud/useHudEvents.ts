import { useEffect, useRef, useState } from 'react';
import { GameWorldSnapshot, ServerCrate, ServerTank } from '../../online/types';

/**
 * События HUD из diff-а снапшотов: попадания (HP), убийства, взрывы/импакты.
 * Звук столкновения корпуса — только по полю `hullCollisions` из снапшота
 * (сервер фиксирует реальный нормальный импульс в физике), без эвристик по
 * скорости на клиенте.
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
    /** Граната/снаряд взорвался (отдельно от взрыва танка). */
    onGrenadeExplosion?: (x: number, y: number) => void;
    /**
     * Прилёт пули. `hitTank` помогает звуковому слою различать
     * звон по броне и глухой тук по стене/земле.
     */
    onNewBulletImpact?: (x: number, y: number, hitTank: boolean, bulletType: number) => void;
    onOwnShot?: (bulletType: number) => void;
    onOwnDamage?: (dmg: number) => void;
    onTankKilled?: (tank: ServerTank) => void;
    /**
     * Удар корпуса (данные с сервера: точка контакта и игрок, чей танк
     * участвовал в разрешении контакта).
     */
    onTankCollision?: (x: number, y: number, playerId: string) => void;
    /** Ящик разрушен (исчез или hp ≤ 0). */
    onCrateBroken?: (x: number, y: number) => void;
}

export function useHudEvents(snapshotRef: React.MutableRefObject<GameWorldSnapshot | null>, opts: Options) {
    const [state, setState] = useState<HudEventsState>({ hits: [], kills: [], damageTaken: [] });
    const prevTanksRef = useRef<Map<string, ServerTank>>(new Map());
    /** Уже учтённые id пуль (с prune при исчезновении из мира). */
    const seenBulletIdsRef = useRef<Set<number>>(new Set());
    /** Первый кадр после входа — только заполняем seen, без звука «свой выстрел». */
    const bulletsPrimedRef = useRef(false);
    const explosionsSeenRef = useRef<Set<string>>(new Set());
    const impactsSeenRef = useRef<Set<string>>(new Set());
    const hullCollisionsSeenRef = useRef<Set<string>>(new Set());
    const prevCratesRef = useRef<Map<number, ServerCrate>>(new Map());

    useEffect(() => {
        seenBulletIdsRef.current.clear();
        bulletsPrimedRef.current = false;

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
                        const k = `tank|${ex.x}|${ex.y}|${ex.angle}`;
                        if (!explosionsSeenRef.current.has(k)) {
                            explosionsSeenRef.current.add(k);
                            opts.onNewExplosion?.(ex.x, ex.y);
                        }
                    }
                }
                if (snap.grenadeExplosions) {
                    for (const ex of snap.grenadeExplosions) {
                        // size — часть ключа, чтобы не схлопнуть рядом стоящие гранаты разного калибра
                        const k = `grenade|${ex.x}|${ex.y}|${ex.angle}|${ex.size}`;
                        if (!explosionsSeenRef.current.has(k)) {
                            explosionsSeenRef.current.add(k);
                            opts.onGrenadeExplosion?.(ex.x, ex.y);
                        }
                    }
                }
                if (explosionsSeenRef.current.size > 1024) {
                    explosionsSeenRef.current.clear();
                }
                if (snap.bulletImpacts) {
                    // Чтобы понять, попала ли пуля по броне, ищем ближайший
                    // танк, который только что получил урон. В пределах ~70 ед —
                    // считаем попаданием по танку (металлический звон), иначе
                    // глухой удар по стене/ящику.
                    const HIT_RADIUS = 70;
                    const recentHits = newHits;
                    for (const im of snap.bulletImpacts) {
                        const k = `${im.x}|${im.y}|${im.angle}|${im.bulletType}`;
                        if (!impactsSeenRef.current.has(k)) {
                            impactsSeenRef.current.add(k);
                            let hitTank = false;
                            for (const h of recentHits) {
                                if (Math.hypot(h.x - im.x, h.y - im.y) < HIT_RADIUS) {
                                    hitTank = true;
                                    break;
                                }
                            }
                            opts.onNewBulletImpact?.(im.x, im.y, hitTank, im.bulletType);
                        }
                    }
                    if (impactsSeenRef.current.size > 1024) {
                        impactsSeenRef.current.clear();
                    }
                }

                if (snap.hullCollisions) {
                    for (const h of snap.hullCollisions) {
                        const k = `hull|${h.tick}|${h.playerId}|${Math.round(h.x)}|${Math.round(h.y)}`;
                        if (!hullCollisionsSeenRef.current.has(k)) {
                            hullCollisionsSeenRef.current.add(k);
                            opts.onTankCollision?.(h.x, h.y, h.playerId);
                        }
                    }
                    if (hullCollisionsSeenRef.current.size > 1024) {
                        hullCollisionsSeenRef.current.clear();
                    }
                }

                // ----- Разрушение ящиков ----
                if (snap.crates) {
                    const prevCrates = prevCratesRef.current;
                    const currCrates = new Map<number, ServerCrate>();
                    for (const c of snap.crates) currCrates.set(c.id, c);

                    if (prevCrates.size > 0) {
                        for (const [id, prevC] of prevCrates) {
                            const curr = currCrates.get(id);
                            if (!curr) {
                                // Был и пропал — разрушен
                                opts.onCrateBroken?.(prevC.x, prevC.y);
                            } else if (prevC.hp > 0 && curr.hp <= 0) {
                                opts.onCrateBroken?.(curr.x, curr.y);
                            }
                        }
                    }
                    prevCratesRef.current = currCrates;
                }

                // Свой выстрел: новая пуля в снапшоте с sourceTankId === id своего танка
                // (сервер присылает sourceTankId; без него — тихо пропускаем, см. старые повторы).
                const myTankId = myTank?.id;
                const currBulletIdSet = new Set<number>();
                for (const b of snap.bullets) {
                    currBulletIdSet.add(b.id);
                    if (seenBulletIdsRef.current.has(b.id)) continue;
                    seenBulletIdsRef.current.add(b.id);
                    if (bulletsPrimedRef.current && myTankId && b.sourceTankId === myTankId) {
                        opts.onOwnShot?.(b.type);
                    }
                }
                if (!bulletsPrimedRef.current) {
                    bulletsPrimedRef.current = true;
                }
                for (const id of seenBulletIdsRef.current) {
                    if (!currBulletIdSet.has(id)) {
                        seenBulletIdsRef.current.delete(id);
                    }
                }

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
