import {IEntity} from "../model/entities/IEntity";
import {Axis, calcDotProduct} from "./Point";

/**
 * Utility class for detecting collisions between entities using the Separating Axis Theorem (SAT).
 */
export class CollisionDetector {
    private constructor() { }

    /**
     * Checks if two entities are intersecting using the Separating Axis Theorem (SAT).
     * @param entity1 The first entity to check for intersection.
     * @param entity2 The second entity to check for intersection.
     * @returns `true` if the two entities intersect, `false` otherwise.
     */
    public static isIntersect(entity1: IEntity, entity2: IEntity): boolean {
        const axes = CollisionDetector.getAxes(entity1).concat(CollisionDetector.getAxes(entity2));

        for (const axis of axes) {
            const projection1 = CollisionDetector.getProject(entity1, axis);
            const projection2 = CollisionDetector.getProject(entity2, axis);

            if (!CollisionDetector.isOverlap(projection1, projection2))
                return false;
        }

        return true;
    }
    private static isOverlap(projection1: Projection, projection2: Projection): boolean {
        return projection1.min < projection2.max && projection2.min < projection1.max;
    }
    public static getAxes(entity: IEntity): Axis[] {
        const axes: Axis[] = [];
        const lastIndex = entity.points.length - 1;

        for (let i = 0; i < lastIndex; i++)
            axes.push(Axis.create(entity.points[i], entity.points[i + 1]));
        axes.push(Axis.create(entity.points[lastIndex], entity.points[0]));

        return axes;
    }
    public static getProject(entity: IEntity, axis: Axis): Projection {
        let min = calcDotProduct(axis, entity.points[0]);
        let max = min;

        for (let i = 1; i < entity.points.length; i++) {
            const dotProduct = calcDotProduct(axis, entity.points[i]);
            if (dotProduct < min)
                min = dotProduct;
            else if (dotProduct > max)
                max = dotProduct;
        }

        return { min, max };
    }
}
export type Projection = {
    min: number;
    max: number;
}