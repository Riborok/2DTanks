import {Axis, Point, Vector} from "./Point";
import {VectorUtils} from "./VectorUtils";
import {CollisionResult} from "../additionally/type";
import {calcMidBetweenTwoPoint} from "./additionalFunc";
import {IPolygon} from "../polygon/IPolygon";

/**
 * Utility class for detecting collisions between polygons using the Separating Axis Theorem (SAT).
 */
export class CollisionDetector {
    private constructor() { }

    /**
     * Checks if two polygons are intersecting using the Separating Axis Theorem (SAT).
     * @param polygon1 The first polygon to check for intersection.
     * @param polygon2 The second polygon to check for intersection.
     * @returns `true` if the two polygons intersect, `false` otherwise.
     */
    public static hasCollision(polygon1: IPolygon, polygon2: IPolygon): boolean {
        const axes1 = CollisionDetector.getAxes(polygon1);
        const axes2 = CollisionDetector.getAxes(polygon2);

        function areProjectionsOverlapping(axes: Axis[]): boolean {
            for (const axis of axes) {
                const projection1 = CollisionDetector.getProjection(polygon1, axis);
                const projection2 = CollisionDetector.getProjection(polygon2, axis);

                if (Math.min(projection1.max - projection2.min, projection2.max - projection1.min) <= 0)
                    return false;
            }
            return true;
        }

        return areProjectionsOverlapping(axes1) && areProjectionsOverlapping(axes2);
    }
    /**
     * Calculates the collision result between two polygons using the Separating Axis Theorem (SAT).
     * @param polygon1 The first polygon to calculate collision result for.
     * @param polygon2 The second polygon to calculate collision result for.
     * @returns A `CollisionResult` object if a collision occurred, or `null` if there's no collision.
     */
    public static getCollisionResult(polygon1: IPolygon, polygon2: IPolygon): CollisionResult | null {
        const axes1 = CollisionDetector.getAxes(polygon1);
        const axes2 = CollisionDetector.getAxes(polygon2);

        let smallestOverlap = Number.MAX_VALUE;
        let collisionAxis: Axis;
        let isPolygon1Axis: boolean;

        function isSmallestOverlapAxisFound(axes: Axis[]): boolean {
            const isAxes1 = axes === axes1;
            for (const axis of axes) {
                const projection1 = CollisionDetector.getProjection(polygon1, axis);
                const projection2 = CollisionDetector.getProjection(polygon2, axis);

                const overlap = Math.min(projection1.max - projection2.min, projection2.max - projection1.min);

                if (overlap <= 0)
                    return false;

                if (overlap < smallestOverlap) {
                    smallestOverlap = overlap;
                    collisionAxis = axis;
                    isPolygon1Axis = isAxes1;
                }
            }
            return true;
        }
        if (!isSmallestOverlapAxisFound(axes1) || !isSmallestOverlapAxisFound(axes2))
            return null;

        return {collisionPoint: CollisionDetector.findClosestVertex(polygon1, polygon2, collisionAxis, isPolygon1Axis),
            overlap: smallestOverlap}
    }
    private static readonly EPSILON: number = 1;
    private static findClosestVertex(polygon1: IPolygon, polygon2: IPolygon, axis: Axis, isPolygon1Axis: boolean): Point {
        let projection: Projection;
        let extendedProjection: ExtendedProjection;
        if (isPolygon1Axis) {
            projection = this.getProjection(polygon1, axis);
            extendedProjection = this.getExtendedProjection(polygon2, axis);
        }
        else {
            projection = this.getProjection(polygon2, axis);
            extendedProjection = this.getExtendedProjection(polygon1, axis);
        }

        return (extendedProjection.max - projection.min < projection.max - extendedProjection.min)
            ? extendedProjection.maxPoint
            : extendedProjection.minPoint;
    }
    private static getExtendedProjection(polygon: IPolygon, axis: Axis): ExtendedProjection {
        let min = VectorUtils.dotProduct(axis, polygon.points[0]);
        let max = min;
        let minPoint = polygon.points[0];
        let maxPoint = polygon.points[0];

        for (let i = 1; i < polygon.points.length; i++) {
            const dotProduct = VectorUtils.dotProduct(axis, polygon.points[i]);

            if (Math.abs(dotProduct - min) < this.EPSILON)
                minPoint = calcMidBetweenTwoPoint(minPoint, polygon.points[i]);
            else if (Math.abs(dotProduct - max) < this.EPSILON)
                maxPoint = calcMidBetweenTwoPoint(maxPoint, polygon.points[i]);

            else if (dotProduct < min) {
                min = dotProduct;
                minPoint = polygon.points[i];
            }
            else if (dotProduct > max) {
                max = dotProduct;
                maxPoint = polygon.points[i];
            }
        }

        return { min, max, minPoint, maxPoint }
    }
    private static getAxes(polygon: IPolygon): Axis[] {
        const axes = new Array<Axis>();
        const lastIndex = polygon.points.length - 1;

        for (let i = 0; i < lastIndex; i++)
            axes.push(Axis.create(polygon.points[i], polygon.points[i + 1]));
        axes.push(Axis.create(polygon.points[lastIndex], polygon.points[0]));

        return axes;
    }
    private static getProjection(polygon: IPolygon, axis: Vector): Projection {
        let min = VectorUtils.dotProduct(axis, polygon.points[0]);
        let max = min;

        for (let i = 1; i < polygon.points.length; i++) {
            const dotProduct = VectorUtils.dotProduct(axis, polygon.points[i]);
            if (dotProduct < min)
                min = dotProduct;
            else if (dotProduct > max)
                max = dotProduct;
        }

        return { min, max }
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