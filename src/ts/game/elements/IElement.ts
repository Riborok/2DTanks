import {IIdentifiable} from "../id/IIdentifiable";
import {ISprite} from "../../sprite/ISprite";
import {TankSprite} from "../../sprite/tank/TankSprite";
import {IEntity} from "../../polygon/entity/IEntity";
import {Model} from "../../model/Model";
import {IEntityLifecycle} from "../../additionally/type";

export interface IElement extends IIdentifiable, IEntityLifecycle<ISprite, IEntity> {
    get model(): Model;
    get sprite(): ISprite | TankSprite;
}