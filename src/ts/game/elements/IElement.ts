import {IIdentifiable} from "../id/IIdentifiable";
import {ISprite, ISpriteParts} from "../../sprite/ISprite";
import {IEntity} from "../../polygon/entity/IEntity";
import {IModel} from "../../model/IModel";
import {IEntityLifecycle} from "../../additionally/type";

export interface IElement extends IIdentifiable, IEntityLifecycle<ISprite, IEntity> {
    get model(): IModel;
    get sprite(): ISprite | ISpriteParts;
}