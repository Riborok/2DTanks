import {IIdentifiable} from "../id/IIdentifiable";
import {Sprite} from "../../sprite/Sprite";
import {TankSprite} from "../../sprite/tank/TankSprite";
import {IEntity} from "../../model/entitiy/IEntity";
import {IStorage} from "../../model/entitiy/IEntityCollisionSystem";
import {Model} from "../../model/Model";

export interface IElement extends IIdentifiable {
    get model(): Model;
    get sprite(): Sprite | TankSprite;
    spawn(canvas: Element, entityStorage: IStorage<IEntity>): void;
}