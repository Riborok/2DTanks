import { Point, Vector } from '../../src/geometry/Point';
import { RectangularEntity } from '../../src/polygon/entity/IEntity';

describe('RectangularEntity', () => {
    it('lengthwiseArea and movementLength depend on angle vs velocity', () => {
        const e = new RectangularEntity(new Point(0, 0), 8, 6, Math.PI / 4, 2, 1);
        e.velocity.addVector(new Vector(1, 0));
        expect(e.lengthwiseArea).toBeGreaterThan(0);
        expect(e.movementLength).toBeGreaterThan(0);
    });

    it('adjustPolygon with angle applies EntityManipulator rotation', () => {
        const e = new RectangularEntity(new Point(5, 5), 10, 4, Math.PI / 6, 1, 2);
        expect(e.angle).toBeCloseTo(Math.PI / 6);
    });

    it('exposes mass, id, radiusLength, momentOfInertia', () => {
        const e = new RectangularEntity(new Point(0, 0), 6, 8, 0, 12, 99);
        expect(e.mass).toBe(12);
        expect(e.id).toBe(99);
        expect(e.radiusLength).toBeCloseTo(0.5 * Math.sqrt(36 + 64));
        expect(e.momentOfInertia).toBeGreaterThan(0);
    });
});
