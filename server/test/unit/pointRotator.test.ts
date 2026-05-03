import { Point } from '../../src/geometry/Point';
import { PointRotator } from '../../src/geometry/PointRotator';

describe('PointRotator', () => {
    it('rotatePoint applies 2D rotation around origin', () => {
        const p = new Point(1, 0);
        PointRotator.rotatePoint(p, 0, 1);
        expect(p.x).toBeCloseTo(1);
        expect(p.y).toBeCloseTo(0);
        PointRotator.rotatePoint(p, 1, 0);
        expect(p.x).toBeCloseTo(0);
        expect(p.y).toBeCloseTo(1);
    });

    it('rotatePointAroundTarget rotates relative to pivot', () => {
        const pivot = new Point(10, 10);
        const p = new Point(12, 10);
        PointRotator.rotatePointAroundTarget(p, pivot, 0, -1);
        expect(p.x).toBeCloseTo(8);
        expect(p.y).toBeCloseTo(10);
    });
});
