import { Point, Vector } from '../../src/geometry/Point';
import { PHYSICS_REFERENCE_DELTA_MS } from '../../src/constants/gameConstants';
import { EntityManipulator } from '../../src/polygon/entity/EntityManipulator';
import { RectangularEntity } from '../../src/polygon/entity/IEntity';

describe('EntityManipulator', () => {
    it('movement translates all points by velocity scaled by deltaTime', () => {
        const e = new RectangularEntity(new Point(10, 20), 4, 4, 0, 1, 1);
        e.velocity.addVector(new Vector(2, -1));
        const before = e.points.map((p) => ({ x: p.x, y: p.y }));
        EntityManipulator.movement(e, PHYSICS_REFERENCE_DELTA_MS);
        const scale = 1;
        for (let i = 0; i < e.points.length; i++) {
            expect(e.points[i].x).toBeCloseTo(before[i].x + 2 * scale);
            expect(e.points[i].y).toBeCloseTo(before[i].y - 1 * scale);
        }
    });

    it('angularMovement rotates geometry without rotating velocity vector', () => {
        const e = new RectangularEntity(new Point(0, 0), 10, 4, 0, 1, 1);
        e.velocity.addVector(new Vector(5, 0));
        const vx0 = e.velocity.x;
        const vy0 = e.velocity.y;
        e.angularVelocity = Math.PI / 4;
        EntityManipulator.angularMovement(e, PHYSICS_REFERENCE_DELTA_MS);
        expect(e.velocity.x).toBeCloseTo(vx0);
        expect(e.velocity.y).toBeCloseTo(vy0);
        expect(e.angle).not.toBe(0);
    });

    it('rotateEntity rotates points and velocity around center', () => {
        const e = new RectangularEntity(new Point(0, 0), 10, 10, 0, 1, 1);
        e.velocity.addVector(new Vector(1, 0));
        EntityManipulator.rotateEntity(e, Math.PI / 2);
        expect(e.velocity.x).toBeCloseTo(0);
        expect(e.velocity.y).toBeCloseTo(1);
    });
});
