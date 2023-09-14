import {WallModel} from "../../model/obstacle/WallModel";
import {WallSprite} from "../../sprite/obstacles/WallSprite";
import {IElement} from "./IElement";
import {IEntity} from "../../entitiy/IEntity";
import {IStorage} from "../../entitiy/IEntityCollisionSystem";

export class WallElement implements IElement {
    private readonly _model: WallModel;
    private readonly _sprite: WallSprite;
    private readonly _id: number;
    public constructor(model: WallModel, sprite: WallSprite) {
        this._model = model;
        this._sprite = sprite;
        this._id = model.entity.id;
    }
    public get model(): WallModel { return this._model }
    public get sprite(): WallSprite { return this._sprite }
    public get id(): number { return this._id }
    public spawn(canvas: Element, entityStorage: IStorage<IEntity>) {
        canvas.appendChild(this._sprite.sprite);

        entityStorage.insert(this._model.entity);
    }
    public vanish(entityStorage: IStorage<IEntity>) {
        this._sprite.remove();
        entityStorage.remove(this._model.entity);
    }
}