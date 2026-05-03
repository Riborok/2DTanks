import { ModelIDTracker } from '../../src/utils/IDTracker';

describe('ModelIDTracker', () => {
    describe('type predicates from encoded ids', () => {
        it('isTank for tank-type suffix', () => {
            expect(ModelIDTracker.isTank(1000)).toBe(true);
            expect(ModelIDTracker.isTank(5000)).toBe(true);
            expect(ModelIDTracker.isTank(1001)).toBe(false);
        });

        it('isWall for wall-type suffix', () => {
            expect(ModelIDTracker.isWall(1001)).toBe(true);
            expect(ModelIDTracker.isTank(1001)).toBe(false);
        });

        it('isBullet for bullet-type suffix', () => {
            expect(ModelIDTracker.isBullet(2002)).toBe(true);
            expect(ModelIDTracker.isTank(2002)).toBe(false);
        });
    });

    describe('sequential tankId', () => {
        it('two consecutive tank ids differ and both are tanks', () => {
            const a = ModelIDTracker.tankId;
            const b = ModelIDTracker.tankId;
            expect(a).not.toBe(b);
            expect(ModelIDTracker.isTank(a)).toBe(true);
            expect(ModelIDTracker.isTank(b)).toBe(true);
        });
    });

    describe('reseedCountersFromMaxEntityIds', () => {
        it('next tank id after reseed is above previous max index', () => {
            const t1 = ModelIDTracker.tankId;
            const t2 = ModelIDTracker.tankId;
            const maxN = Math.max(Math.floor(t1 / 1000), Math.floor(t2 / 1000));
            ModelIDTracker.reseedCountersFromMaxEntityIds([t1, t2]);
            const t3 = ModelIDTracker.tankId;
            expect(Math.floor(t3 / 1000)).toBeGreaterThan(maxN);
        });
    });
});
