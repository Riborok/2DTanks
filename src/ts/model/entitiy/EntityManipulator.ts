import {TrigCache} from "../../additionally/LRUCache";
import {PointRotator} from "../../geometry/PointRotator";
import {IEntity} from "./IEntity";
import {Point, Vector} from "../../geometry/Point";

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
    public static rotatePointAroundTarget(entity: IEntity, deltaAngle: number, target: Point) {
        entity.directionAngle += deltaAngle;
        const sin = TrigCache.getSin(deltaAngle);
        const cos = TrigCache.getCos(deltaAngle);

        for (const point of entity.points)
            PointRotator.rotatePointAroundTarget(point, target, sin, cos);
    }
    public static setVelocity(entity: IEntity, velocity: Vector) {
        entity.speed = velocity.length;
        entity.directionAngle = Math.atan2(velocity.y, velocity.x);
    }
}