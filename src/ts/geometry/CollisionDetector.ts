import {Axis, Point, Vector} from "./Point";
import {VectorUtils} from "./VectorUtils";
import {CollisionResult} from "../additionally/type";
import {calcMidBetweenTwoPoint} from "./additionalFunc";
import {IPolygon} from "../polygon/IPolygon";
import {areOrthogonal} from "../additionally/additionalFunc";

class CollisionResultHelper {
    smallestOverlap: number = Number.MAX_VALUE;
    collisionAxis: Axis = null;
    isPolygon1Axis: boolean = false;
}

/**
 * Utility class for detecting collisions between polygons using the Separating Axis Theorem (SAT).
 */
export class CollisionDetector {
    private constructor() { }

    /**
     * Calculates the axes for a given polygon using its points.
     * These axes are used for collision detection using the Separating Axis Theorem (SAT).
     * @param polygon The polygon for which to calculate the axes.
     * @returns An array of axes representing the edges of the polygon.
     */
    public static getAxes(polygon: IPolygon): Axis[] {
        const axes = new Array<Axis>();
        const lastIndex = polygon.points.length - 1;

        for (let i = 0; i < lastIndex; i++)
            axes.push(Axis.create(polygon.points[i], polygon.points[i + 1]));
        axes.push(Axis.create(polygon.points[lastIndex], polygon.points[0]));

        return axes;
    }

    /**
     * Checks if two polygons are intersecting using the Separating Axis Theorem (SAT).
     * This function takes in two polygons and their corresponding sets of axes for collision detection.
     * @param polygon1 The first polygon to check for intersection.
     * @param polygon2 The second polygon to check for intersection.
     * @param axes1 The axes for collision detection of the first polygon.
     * @param axes2 The axes for collision detection of the second polygon.
     * @returns `true` if the two polygons intersect, `false` otherwise.
     */
    public static hasCollision(polygon1: IPolygon,  polygon2: IPolygon, axes1: Axis[], axes2: Axis[]): boolean {
        return CollisionDetector.areProjectionsOverlapping(axes1, polygon1, polygon2) &&
            CollisionDetector.areProjectionsOverlapping(axes2, polygon1, polygon2);
    }
    private static areProjectionsOverlapping(axes: Axis[], polygon1: IPolygon, polygon2: IPolygon): boolean {
        for (const axis of axes) {
            const projection1 = CollisionDetector.getProjection(polygon1, axis);
            const projection2 = CollisionDetector.getProjection(polygon2, axis);

            if (Math.min(projection1.max - projection2.min, projection2.max - projection1.min) <= 0) {
                return false;
            }
        }
        return true;
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

        const collisionResultHelp: CollisionResultHelper = new CollisionResultHelper();

        if (!CollisionDetector.isSmallestOverlapAxisFound(axes1, true, polygon1, polygon2, collisionResultHelp)
                ||
            !CollisionDetector.isSmallestOverlapAxisFound(axes2, false, polygon1, polygon2, collisionResultHelp))
            return null;

        return {collisionPoint: CollisionDetector.findClosestVertex(polygon1, polygon2,
                collisionResultHelp.collisionAxis, collisionResultHelp.isPolygon1Axis),
            overlap: collisionResultHelp.smallestOverlap}
    }
    private static isSmallestOverlapAxisFound(axes: Axis[], isAxes1: boolean, polygon1: IPolygon, polygon2: IPolygon,
                                              collisionResultHelp: CollisionResultHelper): boolean {
        for (const axis of axes) {
            const projection1 = CollisionDetector.getProjection(polygon1, axis);
            const projection2 = CollisionDetector.getProjection(polygon2, axis);

            const overlap = Math.min(projection1.max - projection2.min, projection2.max - projection1.min);

            if (overlap <= 0)
                return false;

            if (overlap < collisionResultHelp.smallestOverlap) {
                collisionResultHelp.smallestOverlap = overlap;
                collisionResultHelp.collisionAxis = axis;
                collisionResultHelp.isPolygon1Axis = isAxes1;
            }
        }
        return true;
    }

    private static readonly EPSILON: number = 1;
    private static findClosestVertex(polygon1: IPolygon, polygon2: IPolygon, axis: Axis, isPolygon1Axis: boolean): Point {
        let projection: Projection;
        let extendedProjection: ExtendedProjection;
        if (isPolygon1Axis && !areOrthogonal(polygon1.angle, polygon2.angle)) {
            projection = this.getProjection(polygon1, axis);
            extendedProjection = this.getExtendedProjection(polygon2, axis, false);
        }
        else {
            projection = this.getProjection(polygon2, axis);
            extendedProjection = this.getExtendedProjection(polygon1, axis, true);
        }

        return (extendedProjection.max - projection.min < projection.max - extendedProjection.min)
            ? extendedProjection.maxPoint
            : extendedProjection.minPoint;
    }
    private static getExtendedProjection(polygon: IPolygon, axis: Axis, calculateMidPoint: boolean): ExtendedProjection {
        let min = VectorUtils.dotProduct(axis, polygon.points[0]);
        let max = min;
        let minPoint = polygon.points[0];
        let maxPoint = polygon.points[0];

        for (let i = 1; i < polygon.points.length; i++) {
            const dotProduct = VectorUtils.dotProduct(axis, polygon.points[i]);

            if (dotProduct < min) {
                min = dotProduct;
                minPoint = polygon.points[i];
            }
            else if (dotProduct > max) {
                max = dotProduct;
                maxPoint = polygon.points[i];
            }
            else if (calculateMidPoint && Math.abs(dotProduct - min) < this.EPSILON)
                minPoint = calcMidBetweenTwoPoint(minPoint, polygon.points[i]);
            else if (calculateMidPoint && Math.abs(dotProduct - max) < this.EPSILON)
                maxPoint = calcMidBetweenTwoPoint(maxPoint, polygon.points[i]);
        }

        return { min, max, minPoint, maxPoint }
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