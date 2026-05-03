import { Point, Vector } from '../../src/geometry/Point';

describe('Point / Vector', () => {
    it('Vector.normalize leaves zero vector unchanged', () => {
        const v = new Vector(0, 0);
        v.normalize();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
    });

    it('Vector.normalize scales to unit length', () => {
        const v = new Vector(3, 4);
        v.normalize();
        expect(v.length).toBeCloseTo(1);
        expect(v.x).toBeCloseTo(0.6);
        expect(v.y).toBeCloseTo(0.8);
    });

    it('Vector.scale multiplies components', () => {
        const v = new Vector(2, -3);
        v.scale(2);
        expect(v.x).toBe(4);
        expect(v.y).toBe(-6);
    });

    it('Vector.addVector and subtractVector', () => {
        const a = new Vector(1, 2);
        a.addVector(new Vector(10, -1));
        expect(a.x).toBe(11);
        expect(a.y).toBe(1);
        a.subtractVector(new Vector(1, 1));
        expect(a.x).toBe(10);
        expect(a.y).toBe(0);
    });

    it('Point.addToCoordinates', () => {
        const p = new Point(5, 5);
        p.addToCoordinates(-2, 3);
        expect(p.x).toBe(3);
        expect(p.y).toBe(8);
    });
});
