import {IEntity} from "../entitiy/IEntity";
import {Axis, Point, Vector} from "./Point";
import {VectorUtils} from "./VectorUtils";
import {CollisionResult} from "../additionally/type";
import {calcMidBetweenTwoPoint} from "./additionalFunc";

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
    public static hasCollision(entity1: IEntity, entity2: IEntity): boolean {
        const axes1 = CollisionDetector.getAxes(entity1);
        const axes2 = CollisionDetector.getAxes(entity2);

        function areProjectionsOverlapping(axes: Axis[]): boolean {
            for (const axis of axes) {
                const projection1 = CollisionDetector.getProjection(entity1, axis);
                const projection2 = CollisionDetector.getProjection(entity2, axis);

                if (Math.min(projection1.max - projection2.min, projection2.max - projection1.min) <= 0)
                    return false;
            }
            return true;
        }

        return areProjectionsOverlapping(axes1) && areProjectionsOverlapping(axes2);
    }
    /**
     * Calculates the collision result between two entities using the Separating Axis Theorem (SAT).
     * @param entity1 The first entity to calculate collision result for.
     * @param entity2 The second entity to calculate collision result for.
     * @returns A `CollisionResult` object if a collision occurred, or `null` if there's no collision.
     */
    public static getCollisionResult(entity1: IEntity, entity2: IEntity): CollisionResult | null {
        const axes1 = CollisionDetector.getAxes(entity1);
        const axes2 = CollisionDetector.getAxes(entity2);

        let smallestOverlap = Number.MAX_VALUE;
        let collisionAxis: Axis;
        let isEntity1Axis: boolean;

        function isSmallestOverlapAxisFound(axes: Axis[]): boolean {
            const isAxes1 = axes === axes1;
            for (const axis of axes) {
                const projection1 = CollisionDetector.getProjection(entity1, axis);
                const projection2 = CollisionDetector.getProjection(entity2, axis);

                const overlap = Math.min(projection1.max - projection2.min, projection2.max - projection1.min);

                if (overlap <= 0)
                    return false;

                if (overlap < smallestOverlap) {
                    smallestOverlap = overlap;
                    collisionAxis = axis;
                    isEntity1Axis = isAxes1;
                }
            }
            return true;
        }
        if (!isSmallestOverlapAxisFound(axes1) || !isSmallestOverlapAxisFound(axes2))
            return null;

        return {collisionPoint: CollisionDetector.findClosestVertex(entity1, entity2, collisionAxis, isEntity1Axis),
            overlap: smallestOverlap};
    }
    private static readonly EPSILON: number = 1;
    private static findClosestVertex(entity1: IEntity, entity2: IEntity, axis: Axis, isEntity1Axis: boolean): Point {
        let projection: Projection;
        let extendedProjection: ExtendedProjection;
        if (isEntity1Axis) {
            projection = this.getProjection(entity1, axis);
            extendedProjection = this.getExtendedProjection(entity2, axis);
        }
        else {
            projection = this.getProjection(entity2, axis);
            extendedProjection = this.getExtendedProjection(entity1, axis);
        }

        return (extendedProjection.max - projection.min < projection.max - extendedProjection.min)
            ? extendedProjection.maxPoint
            : extendedProjection.minPoint;
    }
    private static getExtendedProjection(entity: IEntity, axis: Axis): ExtendedProjection {
        let min = VectorUtils.dotProduct(axis, entity.points[0]);
        let max = min;
        let minPoint = entity.points[0];
        let maxPoint = entity.points[0];

        for (let i = 1; i < entity.points.length; i++) {
            const dotProduct = VectorUtils.dotProduct(axis, entity.points[i]);

            if (Math.abs(dotProduct - min) < this.EPSILON)
                minPoint = calcMidBetweenTwoPoint(minPoint, entity.points[i]);
            else if (Math.abs(dotProduct - max) < this.EPSILON)
                maxPoint = calcMidBetweenTwoPoint(maxPoint, entity.points[i]);

            else if (dotProduct < min) {
                min = dotProduct;
                minPoint = entity.points[i];
            }
            else if (dotProduct > max) {
                max = dotProduct;
                maxPoint = entity.points[i];
            }
        }

        return { min, max, minPoint, maxPoint };
    }
    private static getAxes(entity: IEntity): Axis[] {
        const axes = new Array<Axis>();
        const lastIndex = entity.points.length - 1;

        for (let i = 0; i < lastIndex; i++)
            axes.push(Axis.create(entity.points[i], entity.points[i + 1]));
        axes.push(Axis.create(entity.points[lastIndex], entity.points[0]));

        return axes;
    }
    private static getProjection(entity: IEntity, axis: Vector): Projection {
        let min = VectorUtils.dotProduct(axis, entity.points[0]);
        let max = min;

        for (let i = 1; i < entity.points.length; i++) {
            const dotProduct = VectorUtils.dotProduct(axis, entity.points[i]);
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
type ExtendedProjection = {
    min: number;
    max: number;
    minPoint: Point;
    maxPoint: Point;
}