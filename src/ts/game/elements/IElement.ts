import {IIdentifiable} from "../id/IIdentifiable";
import {ISprite, ISpriteParts} from "../../sprite/ISprite";
import {IEntity} from "../../polygon/entity/IEntity";
import {Model} from "../../model/Model";
import {IEntityLifecycle} from "../../additionally/type";

export interface IElement extends IIdentifiable, IEntityLifecycle<ISprite, IEntity> {
    get model(): Model;
    get sprite(): ISprite | ISpriteParts;
}