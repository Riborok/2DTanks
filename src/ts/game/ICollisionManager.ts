import {RectangularEntity} from "../model/IEntity";
import {IRectangularEntityStorage} from "../model/IRectangularEntityStorage";

export interface ICollisionManager {
    FixIntersection(rectangularEntity: RectangularEntity): void;
}

export class CollisionManager implements ICollisionManager{
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    public constructor(rectangularEntityStorage: IRectangularEntityStorage) {
        this._rectangularEntityStorage = rectangularEntityStorage;
    }
    private static calculateCollisionVector(rectangle1: RectangularEntity, rectangle2: RectangularEntity):
            {dx: number, dy: number} {
        const dx1 = rectangle2.points[1].x - rectangle1.points[0].x;
        const dx2 = rectangle1.points[1].x - rectangle2.points[0].x;
        const dx = Math.min(dx1, dx2);

        const dy1 = rectangle2.points[0].y - rectangle1.points[0].y;
        const dy2 = rectangle1.points[2].y - rectangle2.points[0].y;
        const dy = Math.min(dy1, dy2);

        return {dx, dy};
    }
    public FixIntersection(rectangularEntity: RectangularEntity){
        const collidedRectangularEntity : RectangularEntity | null =
            this._rectangularEntityStorage.checkIntersection(rectangularEntity);

        if (collidedRectangularEntity != null) {
            const { dx, dy } = CollisionManager.calculateCollisionVector(
                rectangularEntity, collidedRectangularEntity);
            rectangularEntity.movePoints(dx, dy)
        }
    }
}