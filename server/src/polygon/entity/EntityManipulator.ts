import {PointRotator} from "../../geometry/PointRotator";
import {IEntity} from "./IEntity";
import {PHYSICS_REFERENCE_DELTA_MS} from "../../constants/gameConstants";

export class EntityManipulator {
    private constructor() { }

    public static movement(entity: IEntity, deltaTime: number) {
        const scale = deltaTime / PHYSICS_REFERENCE_DELTA_MS;
        const dx = entity.velocity.x * scale;
        const dy = entity.velocity.y * scale;
        for (const point of entity.points)
            point.addToCoordinates(dx, dy);
    }

    /** Поворот корпуса без вращения вектора скорости — скорость остаётся в мировых осях (инерция). */
    public static angularMovement(entity: IEntity, deltaTime: number) {
        const scale = deltaTime / PHYSICS_REFERENCE_DELTA_MS;
        EntityManipulator.rotateGeometryOnly(entity, entity.angularVelocity * scale);
    }

    public static rotateEntity(entity: IEntity, deltaAngle: number) {
        const sin = Math.sin(deltaAngle);
        const cos = Math.cos(deltaAngle);
        const center = entity.calcCenter();

        for (const point of entity.points)
            PointRotator.rotatePointAroundTarget(point, center, sin, cos);
        PointRotator.rotatePoint(entity.velocity, sin, cos);
    }

    private static rotateGeometryOnly(entity: IEntity, deltaAngle: number) {
        const sin = Math.sin(deltaAngle);
        const cos = Math.cos(deltaAngle);
        const center = entity.calcCenter();

        for (const point of entity.points)
            PointRotator.rotatePointAroundTarget(point, center, sin, cos);
    }
}

