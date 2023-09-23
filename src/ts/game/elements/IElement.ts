import {IIdentifiable} from "../id/IIdentifiable";
import {ISprite} from "../../sprite/ISprite";
import {TankSprite} from "../../sprite/tank/TankSprite";
import {IEntity} from "../../polygon/entity/IEntity";
import {Model} from "../../model/Model";
import {IStorage} from "../../additionally/type";

export interface IElement extends IIdentifiable {
    get model(): Model;
    get sprite(): ISprite | TankSprite;
    spawn(spriteStorage: IStorage<ISprite>, entityStorage: IStorage<IEntity>): void;
    terminate(spriteStorage: IStorage<ISprite>, entityStorage: IStorage<IEntity>): void;
}