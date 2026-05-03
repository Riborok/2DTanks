import {
    DEATHMATCH_ARENA_WALL_CELLS,
    DEATHMATCH_ARENA_PRESET_COUNT,
    getDeathmatchArenaWallCellsForSeed,
    deathmatchBannedCellsAroundWalls,
    buildFreeSpawnSlots,
    pickDeathmatchSpawnSlots
} from '../../src/game/world/deathmatchArenaLayout';
import { SPAWN_GRIDS_COLUMNS_AMOUNT, SPAWN_GRIDS_LINES_AMOUNT } from '../../src/constants/gameConstants';

describe('deathmatchArenaLayout', () => {
    describe('getDeathmatchArenaWallCellsForSeed', () => {
        it('cycles through DEATHMATCH_ARENA_PRESET_COUNT presets', () => {
            expect(DEATHMATCH_ARENA_PRESET_COUNT).toBe(3);
            const p0 = getDeathmatchArenaWallCellsForSeed(0);
            const p1 = getDeathmatchArenaWallCellsForSeed(1);
            const p2 = getDeathmatchArenaWallCellsForSeed(2);
            const p3 = getDeathmatchArenaWallCellsForSeed(3);
            expect(p0).toEqual(getDeathmatchArenaWallCellsForSeed(6));
            expect(JSON.stringify(p0)).not.toBe(JSON.stringify(p1));
            expect(JSON.stringify(p1)).not.toBe(JSON.stringify(p2));
            expect(p3).toEqual(p0);
        });

        it('default export cells match seed 0 preset', () => {
            expect(getDeathmatchArenaWallCellsForSeed(0)).toEqual(DEATHMATCH_ARENA_WALL_CELLS);
        });
    });

    describe('deathmatchBannedCellsAroundWalls', () => {
        it('ban set size at least wall count', () => {
            const banned = deathmatchBannedCellsAroundWalls(DEATHMATCH_ARENA_WALL_CELLS);
            expect(banned.size).toBeGreaterThanOrEqual(DEATHMATCH_ARENA_WALL_CELLS.length);
        });

        it('keys stay inside spawn grid', () => {
            const banned = deathmatchBannedCellsAroundWalls();
            for (const key of banned) {
                const [ls, cs] = key.split(',').map(Number);
                expect(ls).toBeGreaterThanOrEqual(0);
                expect(ls).toBeLessThan(SPAWN_GRIDS_LINES_AMOUNT);
                expect(cs).toBeGreaterThanOrEqual(0);
                expect(cs).toBeLessThan(SPAWN_GRIDS_COLUMNS_AMOUNT);
            }
        });
    });

    describe('buildFreeSpawnSlots', () => {
        it('free + banned equals full grid', () => {
            const banned = deathmatchBannedCellsAroundWalls();
            const free = buildFreeSpawnSlots(banned);
            const total = SPAWN_GRIDS_LINES_AMOUNT * SPAWN_GRIDS_COLUMNS_AMOUNT;
            expect(free.length + banned.size).toBe(total);
        });
    });

    describe('pickDeathmatchSpawnSlots', () => {
        it('returns empty array when needed <= 0', () => {
            expect(pickDeathmatchSpawnSlots(0, [{ line: 0, col: 0 }])).toEqual([]);
            expect(pickDeathmatchSpawnSlots(-2, [{ line: 0, col: 0 }])).toEqual([]);
        });

        it('takes priority slots first then pads from free list', () => {
            const only = [{ line: 1, col: 1 }];
            const many = pickDeathmatchSpawnSlots(4, only, []);
            expect(many).toHaveLength(4);
            expect(many.every((s) => s.line === 1 && s.col === 1)).toBe(true);
        });

        it('returns distinct slots from full free grid', () => {
            const free = buildFreeSpawnSlots(deathmatchBannedCellsAroundWalls());
            const slots = pickDeathmatchSpawnSlots(4, free);
            expect(slots).toHaveLength(4);
            const uniq = new Set(slots.map((s) => `${s.line},${s.col}`));
            expect(uniq.size).toBe(4);
        });
    });
});
