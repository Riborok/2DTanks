import {IEntity} from "./IEntity";
import {Axis, Point} from "./Point";

export class GeomInteractionUtils {
    private constructor() { }

    /**
     * Rotates the given point around the target point by a specified angle using sine and cosine values.
     * The function modifies the `point` parameter with the new rotated coordinates.
     * @param point The point to be rotated. Its coordinates will be updated.
     * @param targetPoint The target point around which the rotation will be performed.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     */
    public static rotatePointAroundTarget(point: Point, targetPoint: Point, sin: number, cos: number) {
        const deltaX = point.x - targetPoint.x;
        const deltaY = point.y - targetPoint.y;
        point.x = targetPoint.x + deltaX * cos - deltaY * sin;
        point.y = targetPoint.y + deltaX * sin + deltaY * cos;
    }

    /**
     * Checks if two entities are intersecting using the Separating Axis Theorem (SAT).
     * @param entity1 The first entity to check for intersection.
     * @param entity2 The second entity to check for intersection.
     * @returns `true` if the two entities intersect, `false` otherwise.
     */
    public static isIntersect(entity1: IEntity, entity2: IEntity): boolean {
        const axes = GeomInteractionUtils.getAxes(entity1).concat(GeomInteractionUtils.getAxes(entity2));

        for (const axis of axes) {
            const projection1 = GeomInteractionUtils.project(entity1, axis);
            const projection2 = GeomInteractionUtils.project(entity2, axis);

            if (!GeomInteractionUtils.isOverlap(projection1, projection2))
                return false;
        }

        return true;
    }
    private static isOverlap(projection1: Projection, projection2: Projection): boolean {
        return projection1.min < projection2.max && projection2.min < projection1.max;
    }
    private static getAxes(entity: IEntity): Axis[] {
        const axes: Axis[] = [];
        const lastIndex = entity.points.length - 1;

        for (let i = 0; i < lastIndex; i++)
            axes.push(new Axis(entity.points[i], entity.points[i + 1]));
        axes.push(new Axis(entity.points[lastIndex], entity.points[0]));

        return axes;
    }
    private static project(entity: IEntity, axis: Axis): Projection {
        let min = Point.dot(axis, entity.points[0]);
        let max = min;

        for (let i = 1; i < entity.points.length; i++) {
            const dotProduct = Point.dot(axis, entity.points[i]);
            if (dotProduct < min)
                min = dotProduct;
            else if (dotProduct > max)
                max = dotProduct;
        }

        return { min, max };
    }
}
type Projection = {
    min: number;
    max: number;
}