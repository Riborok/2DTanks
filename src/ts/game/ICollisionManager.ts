import {RectangularEntity} from "../model/IEntity";
import {IRectangularEntityStorage} from "../model/IRectangularEntityStorage";

export interface ICollisionManager {
    isSuccess(rectangularEntity: RectangularEntity): boolean;
}

export class CollisionManager implements ICollisionManager {
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    public constructor(rectangularEntityStorage: IRectangularEntityStorage) {
        this._rectangularEntityStorage = rectangularEntityStorage;
    }
    public isSuccess(rectangularEntity: RectangularEntity) : boolean {
        return this._rectangularEntityStorage.checkIntersection(rectangularEntity);
    }
}