import { Point } from '../../src/geometry/Point';
import { CollisionDetector } from '../../src/geometry/CollisionDetector';
import type { IPolygon } from '../../src/polygon/IPolygon';

/** Минимальная реализация IPolygon для юнит-тестов SAT. */
class RectPolygon implements IPolygon {
    constructor(
        public readonly id: number,
        public readonly points: Point[],
        public angle = 0
    ) {}

    calcCenter(): Point {
        let sx = 0;
        let sy = 0;
        for (const p of this.points) {
            sx += p.x;
            sy += p.y;
        }
        const n = this.points.length;
        return new Point(sx / n, sy / n);
    }
}

describe('CollisionDetector', () => {
    describe('getAxes', () => {
        it('returns one axis per edge for rectangle', () => {
            const rect = new RectPolygon(1, [
                new Point(0, 0),
                new Point(10, 0),
                new Point(10, 5),
                new Point(0, 5)
            ]);
            const axes = CollisionDetector.getAxes(rect);
            expect(axes.length).toBe(rect.points.length);
        });
    });

    describe('hasCollision', () => {
        it('returns false for two separated axis-aligned squares', () => {
            const a = new RectPolygon(1, [
                new Point(0, 0),
                new Point(1, 0),
                new Point(1, 1),
                new Point(0, 1)
            ]);
            const b = new RectPolygon(2, [
                new Point(10, 10),
                new Point(11, 10),
                new Point(11, 11),
                new Point(10, 11)
            ]);
            const axesA = CollisionDetector.getAxes(a);
            const axesB = CollisionDetector.getAxes(b);
            expect(CollisionDetector.hasCollision(a, b, axesA, axesB)).toBe(false);
        });

        it('returns true for overlapping squares', () => {
            const a = new RectPolygon(1, [
                new Point(0, 0),
                new Point(2, 0),
                new Point(2, 2),
                new Point(0, 2)
            ]);
            const b = new RectPolygon(2, [
                new Point(1, 1),
                new Point(3, 1),
                new Point(3, 3),
                new Point(1, 3)
            ]);
            const axesA = CollisionDetector.getAxes(a);
            const axesB = CollisionDetector.getAxes(b);
            expect(CollisionDetector.hasCollision(a, b, axesA, axesB)).toBe(true);
        });
    });

    describe('getCollisionResult', () => {
        it('returns overlap and normal for overlapping rectangles', () => {
            const a = new RectPolygon(1, [
                new Point(0, 0),
                new Point(4, 0),
                new Point(4, 4),
                new Point(0, 4)
            ]);
            const b = new RectPolygon(2, [
                new Point(2, 0),
                new Point(6, 0),
                new Point(6, 4),
                new Point(2, 4)
            ]);
            const res = CollisionDetector.getCollisionResult(a, b);
            expect(res).not.toBeNull();
            expect(res!.overlap).toBeGreaterThan(0);
            expect(res!.normal.length).toBeGreaterThan(0);
        });

        it('returns null for separated polygons', () => {
            const a = new RectPolygon(1, [
                new Point(0, 0),
                new Point(1, 0),
                new Point(1, 1),
                new Point(0, 1)
            ]);
            const b = new RectPolygon(2, [
                new Point(5, 5),
                new Point(6, 5),
                new Point(6, 6),
                new Point(5, 6)
            ]);
            expect(CollisionDetector.getCollisionResult(a, b)).toBeNull();
        });
    });
});
