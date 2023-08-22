import {IEntity} from "../model/IEntity";
import {IEntityStorage} from "../model/IEntityStorage";

export interface ICollisionManager {
    isSuccess(entity: IEntity): boolean;
}

export class CollisionManager implements ICollisionManager {
    private readonly _entityStorage: IEntityStorage;
    public constructor(entityStorage: IEntityStorage) {
        this._entityStorage = entityStorage;
    }
    public isSuccess(entity: IEntity) : boolean {
        return !this._entityStorage.isCollision(entity);
    }
}