import {WallModel} from "../../model/obstacle/WallModel";
import {WallSprite} from "../../sprite/obstacles/WallSprite";
import {IEntityStorage} from "../../model/entitiy/IEntityCollisionSystem";
import {IIdentifiable} from "../id/IIdentifiable";

export class WallElement implements IIdentifiable {
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
    public spawn(canvas: Element, entityStorage: IEntityStorage) {
        canvas.appendChild(this._sprite.sprite);

        entityStorage.insert(this._model.entity);
    }
}