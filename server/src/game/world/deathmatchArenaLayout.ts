import { SPAWN_GRIDS_COLUMNS_AMOUNT, SPAWN_GRIDS_LINES_AMOUNT } from '../../constants/gameConstants';

/**
 * Статичные блоки арены (ячейки сетки PointSpawner: 5×11).
 * Симметрия относительно центра: два боковых «кармана» (колонки 4 и 6) и четыре угловых укрытия,
 * без сплошной стены по центру — остаётся вертикальная полоса для обхода и перестрелок.
 */
export const DEATHMATCH_ARENA_WALL_CELLS: ReadonlyArray<{ line: number; col: number }> = [
    { line: 1, col: 2 },
    { line: 1, col: 8 },
    { line: 3, col: 2 },
    { line: 3, col: 8 },
    { line: 2, col: 4 },
    { line: 2, col: 6 }
];

/** Пресет 1: усиление центральной полосы + боковые опоры у длинных сторон. */
const ARENA_WALL_PRESET_SIDE_FOCUS: ReadonlyArray<{ line: number; col: number }> = [
    { line: 0, col: 4 },
    { line: 0, col: 6 },
    { line: 4, col: 4 },
    { line: 4, col: 6 },
    { line: 2, col: 2 },
    { line: 2, col: 8 }
];

/** Пресет 2: вертикальные пары у центральной колонны + верхние углы. */
const ARENA_WALL_PRESET_VERTICAL_PAIRS: ReadonlyArray<{ line: number; col: number }> = [
    { line: 1, col: 5 },
    { line: 3, col: 5 },
    { line: 2, col: 3 },
    { line: 2, col: 7 },
    { line: 0, col: 2 },
    { line: 0, col: 8 }
];

const ARENA_WALL_PRESETS: ReadonlyArray<ReadonlyArray<{ line: number; col: number }>> = [
    DEATHMATCH_ARENA_WALL_CELLS,
    ARENA_WALL_PRESET_SIDE_FOCUS,
    ARENA_WALL_PRESET_VERTICAL_PAIRS
];

export const DEATHMATCH_ARENA_PRESET_COUNT = ARENA_WALL_PRESETS.length;

/** Ротация раскладки статичных стен по `rngSeed` матча (детерминированно для реплея). */
export function getDeathmatchArenaWallCellsForSeed(seed: number): ReadonlyArray<{ line: number; col: number }> {
    const idx = (seed >>> 0) % ARENA_WALL_PRESETS.length;
    return ARENA_WALL_PRESETS[idx]!;
}

/**
 * Ячейки, куда нельзя ставить танки/ящики рядом со статикой (как раньше — «подушка» ±1 по сетке).
 */
export function deathmatchBannedCellsAroundWalls(
    wallCells: ReadonlyArray<{ line: number; col: number }> = DEATHMATCH_ARENA_WALL_CELLS
): Set<string> {
    const banned = new Set<string>();
    for (const { line, col } of wallCells) {
        for (let dl = -1; dl <= 1; dl++) {
            for (let dc = -1; dc <= 1; dc++) {
                const l = line + dl;
                const c = col + dc;
                if (l >= 0 && l < SPAWN_GRIDS_LINES_AMOUNT && c >= 0 && c < SPAWN_GRIDS_COLUMNS_AMOUNT) {
                    banned.add(`${l},${c}`);
                }
            }
        }
    }
    return banned;
}

export function buildFreeSpawnSlots(banned: Set<string>): Array<{ line: number; col: number }> {
    const slots: Array<{ line: number; col: number }> = [];
    for (let line = 0; line < SPAWN_GRIDS_LINES_AMOUNT; line++) {
        for (let col = 0; col < SPAWN_GRIDS_COLUMNS_AMOUNT; col++) {
            if (!banned.has(`${line},${col}`)) {
                slots.push({ line, col });
            }
        }
    }
    return slots;
}

/**
 * Порядок предпочтительных спавнов: дальние противоположные края и углы, затем остальное.
 * Подбирается под типичный deathmatch 2–6 игроков.
 */
export const DEATHMATCH_SPAWN_PRIORITY: ReadonlyArray<{ line: number; col: number }> = [
    { line: 2, col: 0 },
    { line: 2, col: 10 },
    { line: 2, col: 1 },
    { line: 2, col: 9 },
    { line: 1, col: 0 },
    { line: 1, col: 10 },
    { line: 3, col: 0 },
    { line: 3, col: 10 },
    { line: 0, col: 5 },
    { line: 4, col: 5 },
    { line: 0, col: 0 },
    { line: 0, col: 10 },
    { line: 4, col: 0 },
    { line: 4, col: 10 },
    { line: 0, col: 4 },
    { line: 0, col: 6 },
    { line: 4, col: 4 },
    { line: 4, col: 6 },
    { line: 1, col: 4 },
    { line: 1, col: 6 },
    { line: 3, col: 4 },
    { line: 3, col: 6 },
    { line: 0, col: 3 },
    { line: 0, col: 7 },
    { line: 4, col: 3 },
    { line: 4, col: 7 }
];

/**
 * Выбирает до `needed` уникальных ячеек: сначала по приоритету, затем жадно по максимуму
 * минимального расстояния (манхэттен по сетке) до уже занятых — чтобы игроки не появлялись вплотную.
 */
export function pickDeathmatchSpawnSlots(
    needed: number,
    freeSlots: Array<{ line: number; col: number }>,
    priority: ReadonlyArray<{ line: number; col: number }> = DEATHMATCH_SPAWN_PRIORITY
): Array<{ line: number; col: number }> {
    if (needed <= 0) {
        return [];
    }
    const freeSet = new Set(freeSlots.map((s) => `${s.line},${s.col}`));
    const result: Array<{ line: number; col: number }> = [];
    const used = new Set<string>();

    const take = (line: number, col: number): boolean => {
        const k = `${line},${col}`;
        if (!freeSet.has(k) || used.has(k)) {
            return false;
        }
        used.add(k);
        result.push({ line, col });
        return true;
    };

    for (const p of priority) {
        if (result.length >= needed) {
            break;
        }
        take(p.line, p.col);
    }

    while (result.length < needed) {
        let best: { line: number; col: number } | null = null;
        let bestScore = -1;
        for (const s of freeSlots) {
            const k = `${s.line},${s.col}`;
            if (used.has(k)) {
                continue;
            }
            const minD =
                result.length === 0
                    ? 0
                    : Math.min(
                          ...result.map((u) => Math.abs(u.line - s.line) + Math.abs(u.col - s.col))
                      );
            if (minD > bestScore) {
                bestScore = minD;
                best = s;
            }
        }
        if (!best) {
            break;
        }
        used.add(`${best.line},${best.col}`);
        result.push(best);
    }

    let pad = 0;
    while (result.length < needed && freeSlots.length > 0) {
        result.push({ ...freeSlots[pad % freeSlots.length]! });
        pad++;
    }

    return result;
}
