import {RectangularEntity} from "../model/IEntity";
import {IRectangularEntityStorage} from "../model/IRectangularEntityStorage";
import {CollisionUtils} from "../model/CollisionUtils";

export interface ICollisionManager {
    FixIntersection(rectangularEntity: RectangularEntity): void;
}

export class CollisionManager implements ICollisionManager{
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    public constructor(rectangularEntityStorage: IRectangularEntityStorage) {
        this._rectangularEntityStorage = rectangularEntityStorage;
    }
    public FixIntersection(rectangularEntity: RectangularEntity){
        const collidedRectangularEntity : RectangularEntity | null =
            this._rectangularEntityStorage.checkIntersection(rectangularEntity);

        if (collidedRectangularEntity != null) {
            const { dx, dy } = CollisionUtils.calculateCollisionVector(
                rectangularEntity, collidedRectangularEntity);
            rectangularEntity.movePoints(dx, dy)
        }
    }
}