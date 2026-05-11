import type { ServerTank } from './types';

export type TankVisualConfig = {
    hullNum: number;
    trackNum: number;
    turretNum: number;
    weaponNum: number;
    color: number;
};

function pickPart(primary: unknown, secondary: unknown, min: number, max: number, def: number): number {
    const tryVal = (x: unknown): number | null => {
        const n = typeof x === 'number' ? x : typeof x === 'string' ? parseInt(String(x), 10) : NaN;
        if (!Number.isFinite(n)) {
            return null;
        }
        return Math.max(min, Math.min(max, Math.trunc(n)));
    };
    return tryVal(primary) ?? tryVal(secondary) ?? def;
}

function pickColor(primary: unknown, secondary: unknown): number {
    const tryVal = (x: unknown): number | null =>
        typeof x === 'number' && Number.isFinite(x) ? x : null;
    return tryVal(primary) ?? tryVal(secondary) ?? 0;
}

/** Внешний вид танка из снимка (повтор / сервер) с запасным конфигом с лобби. */
export function tankVisualFromSnapshot(
    tank: Partial<ServerTank>,
    fallback?: Partial<TankVisualConfig>
): TankVisualConfig {
    return {
        hullNum: pickPart(tank.hullNum, fallback?.hullNum, 0, 7, 0),
        trackNum: pickPart(tank.trackNum, fallback?.trackNum, 0, 3, 0),
        turretNum: pickPart(tank.turretNum, fallback?.turretNum, 0, 7, 0),
        weaponNum: pickPart(tank.weaponNum, fallback?.weaponNum, 0, 7, 0),
        color: pickColor(tank.color, fallback?.color)
    };
}
