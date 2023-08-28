import {IEntity} from "../model/entitiy/IEntity";
import {Axis, Point, Vector} from "./Point";
import {VectorUtils} from "./VectorUtils";
import {PointUtils} from "./PointUtils";

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
    public static getCollisionPoint(entity1: IEntity, entity2: IEntity): Point | null {
        const axes = CollisionDetector.getAxes(entity1).concat(CollisionDetector.getAxes(entity2));

        let smallestOverlap = Number.MAX_VALUE;
        let collisionAxis: Axis;

        for (const axis of axes) {
            const projection1 = CollisionDetector.getProject(entity1, axis);
            const projection2 = CollisionDetector.getProject(entity2, axis);

            const overlap = Math.min(projection1.max - projection2.min, projection2.max - projection1.min);

            if (overlap <= 0)
                return null;

            if (overlap < smallestOverlap) {
                smallestOverlap = overlap;
                collisionAxis = axis;
            }
        }

        return CollisionDetector.findClosestVertex(entity1, entity2, collisionAxis);
    }
    private static readonly EPSILON: number = 5;
    private static findClosestVertex(entity1: IEntity, entity2: IEntity, axis: Axis): Point {
        let minDistance = Number.MAX_VALUE;
        let closestVertex = new Point(0, 0);

        function updateClosestVertex(supportVertex: Point, vertices: Point[]) {
            for (const vertex of vertices) {
                const projectionLength = Math.abs(VectorUtils.dotProduct(PointUtils.subtract(vertex, supportVertex), axis));
                if (Math.abs(projectionLength - minDistance) < CollisionDetector.EPSILON)
                    closestVertex = new Point((closestVertex.x + vertex.x) / 2, (closestVertex.y + vertex.y) / 2);
                else if (projectionLength < minDistance) {
                    minDistance = projectionLength;
                    closestVertex = vertex;
                }
            }
        }

        updateClosestVertex(entity1.points[0], entity2.points);
        updateClosestVertex(entity2.points[0], entity1.points);

        return closestVertex;
    }
    private static getAxes(entity: IEntity): Axis[] {
        const axes: Axis[] = [];
        const lastIndex = entity.points.length - 1;

        for (let i = 0; i < lastIndex; i++)
            axes.push(Axis.create(entity.points[i], entity.points[i + 1]));
        axes.push(Axis.create(entity.points[lastIndex], entity.points[0]));

        return axes;
    }
    public static getProject(entity: IEntity, axis: Vector): Projection {
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
export type Projection = {
    min: number;
    max: number;
}