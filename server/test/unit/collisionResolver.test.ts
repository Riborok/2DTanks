import { Point, Vector } from '../../src/geometry/Point';
import { CollisionResolver } from '../../src/geometry/CollisionResolver';
import { RectangularEntity } from '../../src/polygon/entity/IEntity';

describe('CollisionResolver', () => {
    it('resolveCollision applies impulse for moving box against static wall', () => {
        const wall = new RectangularEntity(new Point(100, 0), 20, 200, 0, Infinity, 1);
        const tank = new RectangularEntity(new Point(92, 50), 10, 10, 0, 10, 2);
        tank.velocity.addVector(new Vector(12, 0));

        const beforeVx = tank.velocity.x;
        const result = CollisionResolver.resolveCollision(tank, wall);

        expect(result).not.toBeNull();
        expect(result!.jnApplied).toBeGreaterThan(0);
        expect(Math.abs(tank.velocity.x)).toBeLessThan(Math.abs(beforeVx));
    });

    it('resolveCollision returns null when polygons do not overlap', () => {
        const a = new RectangularEntity(new Point(0, 0), 4, 4, 0, 5, 1);
        const b = new RectangularEntity(new Point(50, 50), 4, 4, 0, 5, 2);
        expect(CollisionResolver.resolveCollision(a, b)).toBeNull();
    });
});
