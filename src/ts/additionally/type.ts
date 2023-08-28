import {IEntity} from "../model/entitiy/IEntity";
import {Point} from "../geometry/Point";

export type MovementParameters = {
    finishBackwardSpeed: number;
    finishForwardSpeed: number;
    forwardAcceleration: number;
    backwardAcceleration: number;
}

export type CollisionPack = {
    entity: IEntity,
    collisionPoint: Point
}