import {TrigCache} from "../../additionally/LRUCache";
import {PointRotator} from "../../geometry/PointRotator";
import {IEntity} from "./IEntity";
import {Vector} from "../../geometry/Point";

type CalcVelocity = (entity: IEntity) => Vector;
export class EntityManipulator {
    private constructor() { }
    public static movement(entity: IEntity, calcVelocity: CalcVelocity = EntityManipulator.calcVelocity) {
        const velocity = calcVelocity(entity);
        for (const point of entity.points) {
            point.x += velocity.x;
            point.y += velocity.y;
        }
    }
    public static calcOppositeVelocity(entity: IEntity): Vector {
        return new Vector(
            -entity.speed * TrigCache.getCos(entity.directionAngle),
            -entity.speed * TrigCache.getSin(entity.directionAngle)
        );
    }
    public static calcVelocity(entity: IEntity): Vector {
        return new Vector(
            entity.speed * TrigCache.getCos(entity.directionAngle),
            entity.speed * TrigCache.getSin(entity.directionAngle)
        );
    }
    public static angularMovement(entity: IEntity) {
        entity.directionAngle += entity.angularVelocity;
        const sin = TrigCache.getSin(entity.angularVelocity);
        const cos = TrigCache.getCos(entity.angularVelocity);
        const center = entity.calcCenter();

        for (const point of entity.points)
            PointRotator.rotatePointAroundTarget(point, center, sin, cos);
    }
    public static rotateEntity(entity: IEntity, deltaAngle: number) {
        entity.directionAngle += deltaAngle;
        const sin = TrigCache.getSin(deltaAngle);
        const cos = TrigCache.getCos(deltaAngle);
        const center = entity.calcCenter();

        for (const point of entity.points)
            PointRotator.rotatePointAroundTarget(point, center, sin, cos);
    }
    public static setVelocity(entity: IEntity, velocity: Vector) {
        entity.speed = velocity.length;
        entity.directionAngle = Math.atan2(velocity.y, velocity.x);
    }
}