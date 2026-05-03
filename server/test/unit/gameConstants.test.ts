import {
    CRATE_DYNAMIC_MASS,
    dynamicCrateMass,
    TRACK_SLIP_BY_MATERIAL,
    ResolutionManager
} from '../../src/constants/gameConstants';

describe('gameConstants', () => {
    describe('dynamicCrateMass', () => {
        it('returns value for valid indices', () => {
            expect(dynamicCrateMass(0)).toBe(CRATE_DYNAMIC_MASS[0]);
            expect(dynamicCrateMass(1)).toBe(CRATE_DYNAMIC_MASS[1]);
            expect(dynamicCrateMass(2)).toBe(CRATE_DYNAMIC_MASS[2]);
        });

        it('clamps material index to array bounds', () => {
            expect(dynamicCrateMass(-99)).toBe(CRATE_DYNAMIC_MASS[0]);
            expect(dynamicCrateMass(99)).toBe(CRATE_DYNAMIC_MASS[CRATE_DYNAMIC_MASS.length - 1]);
        });
    });

    it('TRACK_SLIP_BY_MATERIAL has three entries for arena materials', () => {
        expect(TRACK_SLIP_BY_MATERIAL).toHaveLength(3);
        for (const v of TRACK_SLIP_BY_MATERIAL) {
            expect(v).toBeGreaterThan(0);
            expect(v).toBeLessThan(1);
        }
    });

    describe('ResolutionManager', () => {
        it('getTankEntityWidth/Height combine hull and track indent', () => {
            const n = 0;
            expect(ResolutionManager.getTankEntityWidth(n)).toBe(
                ResolutionManager.HULL_WIDTH[n] + ResolutionManager.TRACK_INDENT
            );
            expect(ResolutionManager.getTankEntityHeight(n)).toBe(
                ResolutionManager.HULL_HEIGHT[n] + (ResolutionManager.TRACK_INDENT << 1)
            );
        });
    });
});
