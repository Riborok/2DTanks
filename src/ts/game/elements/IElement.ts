import {IIdentifiable} from "../id/IIdentifiable";
import {ISprite} from "../../sprite/Sprite";
import {TankSprite} from "../../sprite/tank/TankSprite";
import {IEntity} from "../../entitiy/IEntity";
import {IStorage} from "../../entitiy/IEntityCollisionSystem";
import {Model} from "../../model/Model";
import {Canvas} from "../Canvas";

export interface IElement extends IIdentifiable {
    get model(): Model;
    get sprite(): ISprite | TankSprite;
    spawn(canvas: Canvas, entityStorage: IStorage<IEntity>): void;
    vanish(canvas: Canvas, entityStorage: IStorage<IEntity>): void;
}