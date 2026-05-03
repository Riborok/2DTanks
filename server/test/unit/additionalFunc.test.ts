import { Point } from '../../src/geometry/Point';
import {
    calcDistance,
    clampAngle,
    calcTurn,
    calcMidBetweenTwoPoint,
    shortestAngleDelta,
    isAngleInQuadrant2or3
} from '../../src/geometry/additionalFunc';

describe('additionalFunc', () => {
    describe('calcDistance', () => {
        it('3-4-5 triangle', () => {
            expect(calcDistance(new Point(0, 0), new Point(3, 4))).toBe(5);
        });

        it('same point', () => {
            expect(calcDistance(new Point(2, 2), new Point(2, 2))).toBe(0);
        });
    });

    describe('clampAngle', () => {
        it('wraps negative into [0, 2π)', () => {
            const a = clampAngle(-Math.PI / 2);
            expect(a).toBeGreaterThanOrEqual(0);
            expect(a).toBeLessThan(2 * Math.PI);
        });

        it('wraps large positive into [0, 2π)', () => {
            const a = clampAngle(5 * Math.PI);
            expect(a).toBeGreaterThanOrEqual(0);
            expect(a).toBeLessThan(2 * Math.PI);
        });
    });

    describe('calcTurn', () => {
        it('returns difference clamped to period', () => {
            const t = calcTurn(Math.PI, 0);
            expect(t).toBe(Math.PI);
        });
    });

    describe('shortestAngleDelta', () => {
        it('returns shortest delta in [-π, π]', () => {
            expect(shortestAngleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
            expect(shortestAngleDelta(0, Math.PI * 1.5)).toBeCloseTo(-Math.PI / 2);
        });

        it('unwraps via negative branch when delta < -π', () => {
            expect(shortestAngleDelta(Math.PI, -Math.PI * 2.5)).toBeCloseTo(Math.PI / 2);
        });
    });

    describe('isAngleInQuadrant2or3', () => {
        it('true for π', () => {
            expect(isAngleInQuadrant2or3(Math.PI)).toBe(true);
        });

        it('false for 0', () => {
            expect(isAngleInQuadrant2or3(0)).toBe(false);
        });
    });

    describe('calcMidBetweenTwoPoint', () => {
        it('midpoint', () => {
            const m = calcMidBetweenTwoPoint(new Point(0, 0), new Point(10, 10));
            expect(m.x).toBe(5);
            expect(m.y).toBe(5);
        });
    });
});
