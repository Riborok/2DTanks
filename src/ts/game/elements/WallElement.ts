import {WallSprite} from "../../sprite/obstacles/WallSprite";
import {IElement} from "./IElement";
import {IEntity} from "../../polygon/entity/IEntity";
import {IStorage} from "../../additionally/type";
import {ISprite} from "../../sprite/ISprite";
import {IWallModel} from "../../model/obstacle/IWallModel";

export class WallElement implements IElement {
    private readonly _model: IWallModel;
    private readonly _sprite: WallSprite;
    public constructor(model: IWallModel, sprite: WallSprite) {
        this._model = model;
        this._sprite = sprite;
    }
    public get model(): IWallModel { return this._model }
    public get sprite(): WallSprite { return this._sprite }
    public get id(): number { return this._model.entity.id }
    public spawn(spriteStorage: IStorage<ISprite>, entityStorage: IStorage<IEntity>) {
        spriteStorage.insert(this._sprite);
        entityStorage.insert(this._model.entity);
    }
    public terminate(spriteStorage: IStorage<ISprite>, entityStorage: IStorage<IEntity>) {
        spriteStorage.remove(this._sprite);
        entityStorage.remove(this._model.entity);
    }
}