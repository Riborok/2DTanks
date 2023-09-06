import {IIdentifiable} from "../id/IIdentifiable";
import {WallModel} from "../../model/obstacle/WallModel";
import {Sprite} from "../../sprite/Sprite";
import {TankSprite} from "../../sprite/tank/TankSprite";
import {IStorage} from "../../additionally/type";
import {IEntity} from "../../model/entitiy/IEntity";

export interface IElement extends IIdentifiable {
    get model(): WallModel;
    get sprite(): Sprite | TankSprite;
    spawn(canvas: Element, entityStorage: IStorage<IEntity>): void;
}