import {IIdentifiable} from "../id/IIdentifiable";
import {WallModel} from "../../model/obstacle/WallModel";
import {Sprite} from "../../sprite/Sprite";
import {TankSprite} from "../../sprite/tank/TankSprite";
import {IEntity} from "../../model/entitiy/IEntity";
import {IStorage} from "../../model/entitiy/IEntityCollisionSystem";

export interface IElement extends IIdentifiable {
    get model(): WallModel;
    get sprite(): Sprite | TankSprite;
    spawn(canvas: Element, entityStorage: IStorage<IEntity>): void;
}