import {TrigCache} from "../../additionally/LRUCache";
import {PointRotator} from "../../geometry/PointRotator";
import {IEntity} from "./IEntity";
import {Point, Vector} from "../../geometry/Point";

type CalcVector = (entity: IEntity) => Vector;
export class EntityManipulator {
    private constructor() { }
    public static movement(entity: IEntity, calcVector: CalcVector = EntityManipulator.calcMovement) {
        const vector = calcVector(entity);
        for (const point of entity.points) {
            point.x += vector.x;
            point.y += vector.y;
        }
    }
    public static calcOppositeMovement(entity: IEntity): Vector {
        return new Vector(
            -entity.speed * TrigCache.getCos(entity.directionAngle),
            -entity.speed * TrigCache.getSin(entity.directionAngle)
        );
    }
    public static calcMovement(entity: IEntity): Vector {
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
}