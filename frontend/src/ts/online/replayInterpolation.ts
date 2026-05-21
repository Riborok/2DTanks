import type { GameWorldSnapshot, ServerBullet, ServerCrate, ServerTank } from './types';

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
    let d = b - a;
    while (d > Math.PI) {
        d -= 2 * Math.PI;
    }
    while (d < -Math.PI) {
        d += 2 * Math.PI;
    }
    return a + d * t;
}

function normalizeAngleDelta(delta: number): number {
    let d = delta;
    while (d > Math.PI) {
        d -= 2 * Math.PI;
    }
    while (d < -Math.PI) {
        d += 2 * Math.PI;
    }
    return d;
}

export function resolveReplayTankIdle(prev: ServerTank | undefined, next: ServerTank): boolean {
    if (!prev) {
        return typeof next.isIdle === 'boolean' ? next.isIdle : true;
    }
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const distSq = dx * dx + dy * dy;
    const angleDelta = Math.abs(normalizeAngleDelta(next.angle - prev.angle));

    // В реплее считаем "стоит", если за тик почти нет смещения/поворота.
    // Это стабильнее, чем серверный isIdle===velocity.length===0.
    const idleByKinematics = distSq < 0.01 && angleDelta < 0.0035;
    if (idleByKinematics) {
        return true;
    }
    return typeof next.isIdle === 'boolean' ? next.isIdle : false;
}

function lerpTank(prev: ServerTank | undefined, next: ServerTank, t: number): ServerTank {
    if (!prev) {
        return { ...next, isIdle: resolveReplayTankIdle(undefined, next), shieldActive: next.shieldActive };
    }
    const idle = resolveReplayTankIdle(prev, next);
    // Стоящий танк: не интерполируем угол/позицию между ключевыми кадрами.
    // Иначе lerpAngle даёт медленный «поворот» (в т.ч. при обходе ±π) при неизменной стойке.
    if (idle) {
        return {
            ...next,
            x: prev.x,
            y: prev.y,
            angle: prev.angle,
            turretAngle: prev.turretAngle,
            health: next.health,
            maxHealth: next.maxHealth,
            armor: next.armor,
            maxArmor: next.maxArmor,
            isIdle: true,
            shieldActive: next.shieldActive
        };
    }
    return {
        ...next,
        x: lerp(prev.x, next.x, t),
        y: lerp(prev.y, next.y, t),
        angle: lerpAngle(prev.angle, next.angle, t),
        turretAngle: lerpAngle(prev.turretAngle, next.turretAngle, t),
        health: next.health,
        maxHealth: next.maxHealth,
        armor: next.armor,
        maxArmor: next.maxArmor,
        isIdle: false,
        shieldActive: next.shieldActive
    };
}

function lerpCrate(prev: ServerCrate | undefined, next: ServerCrate, t: number): ServerCrate {
    if (!prev) {
        return next;
    }
    // Угол на сервере фиксирован (ящик не вращается) — только позиция сглаживается.
    return {
        ...next,
        x: lerp(prev.x, next.x, t),
        y: lerp(prev.y, next.y, t),
        angle: next.angle
    };
}

function lerpBullet(prev: ServerBullet | undefined, next: ServerBullet, t: number): ServerBullet {
    if (!prev) {
        return next;
    }
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < 0.01) {
        return { ...next, x: prev.x, y: prev.y, angle: prev.angle };
    }
    return {
        ...next,
        x: lerp(prev.x, next.x, t),
        y: lerp(prev.y, next.y, t),
        angle: lerpAngle(prev.angle, next.angle, t)
    };
}

/**
 * Плавный кадр между двумя сохранёнными снимками повтора (0 = from, 1 = to).
 * Взрывы/импакты не копируются — их подмешивает вызывающий при смене ключевого кадра.
 */
export function interpolateReplaySnapshots(
    from: GameWorldSnapshot,
    to: GameWorldSnapshot,
    t: number
): GameWorldSnapshot {
    const clamped = Math.min(1, Math.max(0, t));
    const prevTanks = from.tanks ?? [];
    const nextTanks = to.tanks ?? [];
    const tanks: ServerTank[] = nextTanks.map((nt) => {
        const pt = prevTanks.find((p) => p.id === nt.id);
        return lerpTank(pt, nt, clamped);
    });

    const prevBullets = from.bullets ?? [];
    const nextBullets = to.bullets ?? [];
    const bullets: ServerBullet[] = nextBullets.map((nb) => {
        const pb = prevBullets.find((p) => p.id === nb.id);
        return lerpBullet(pb, nb, clamped);
    });

    const prevCrates = (from.crates ?? []) as ServerCrate[];
    const nextCrates = (to.crates ?? []) as ServerCrate[];
    const crates: ServerCrate[] = nextCrates.map((nc) => {
        const pc = prevCrates.find((p) => p.id === nc.id);
        return lerpCrate(pc, nc, clamped);
    });

    return {
        ...to,
        tanks,
        bullets,
        walls: to.walls,
        crates,
        items: to.items,
        keysCollected: to.keysCollected,
        currentLevel: to.currentLevel,
        timeElapsed: lerp(from.timeElapsed ?? 0, to.timeElapsed ?? 0, clamped),
        gameMode: to.gameMode,
        deathmatchRemainingSec: to.deathmatchRemainingSec,
        deathmatchDurationSec: to.deathmatchDurationSec,
        standardTimeLimitSec: to.standardTimeLimitSec,
        killScores: to.killScores,
        explosions: [],
        grenadeExplosions: [],
        bulletImpacts: [],
        hullCollisions: []
    };
}
