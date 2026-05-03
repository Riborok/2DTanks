import { Point, Vector } from '../../src/geometry/Point';
import { VectorUtils } from '../../src/geometry/VectorUtils';

describe('VectorUtils', () => {
    it('dotProduct', () => {
        expect(VectorUtils.dotProduct(new Point(2, 3), new Point(4, 5))).toBe(23);
    });

    it('crossProduct', () => {
        expect(VectorUtils.crossProduct(new Point(1, 0), new Point(0, 1))).toBe(1);
    });

    it('add', () => {
        const v = VectorUtils.add(new Point(1, 2), new Point(3, 4));
        expect(v.x).toBe(4);
        expect(v.y).toBe(6);
    });

    it('subtract', () => {
        const v = VectorUtils.subtract(new Point(5, 5), new Point(2, 3));
        expect(v.x).toBe(3);
        expect(v.y).toBe(2);
    });

    it('scale', () => {
        const v = VectorUtils.scale(new Point(2, 3), 4);
        expect(v.x).toBe(8);
        expect(v.y).toBe(12);
    });
});

describe('Vector', () => {
    it('length and normalize', () => {
        const v = new Vector(3, 4);
        expect(v.length).toBe(5);
        v.normalize();
        expect(v.x).toBeCloseTo(0.6);
        expect(v.y).toBeCloseTo(0.8);
    });
});
