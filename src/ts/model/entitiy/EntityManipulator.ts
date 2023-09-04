import {PointRotator} from "../../geometry/PointRotator";
import {IEntity} from "./IEntity";

export class EntityManipulator {
    private constructor() { }
    public static movement(entity: IEntity) {
        for (const point of entity.points)
            point.addToCoordinates(entity.velocity.x, entity.velocity.y);
    }
    public static angularMovement(entity: IEntity) {
        EntityManipulator.rotateEntity(entity, entity.angularVelocity);
    }
    public static rotateEntity(entity: IEntity, deltaAngle: number) {
        const sin = Math.sin(deltaAngle);
        const cos = Math.cos(deltaAngle);
        const center = entity.calcCenter();

        for (const point of entity.points)
            PointRotator.rotatePointAroundTarget(point, center, sin, cos);
        PointRotator.rotatePoint(entity.velocity, sin, cos);
    }
}