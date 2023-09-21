import {IElement} from "./IElement";
import {IStorage} from "../../entitiy/IEntityCollisionSystem";
import {IEntity} from "../../entitiy/IEntity";
import {BulletSprite} from "../../sprite/bullet/BulletSprite";
import {BulletModel} from "../../model/bullet/BulletModel";
import {Canvas} from "../Canvas";

export class BulletElement implements IElement {
    private readonly _model: BulletModel;
    private readonly _sprite: BulletSprite;
    private readonly _id: number;
    public constructor(model: BulletModel, sprite: BulletSprite) {
        this._model = model;
        this._sprite = sprite;
        this._id = model.entity.id;
    }
    public get id(): number {
        return this._id;
    }
    public get model(): BulletModel {
        return this._model;
    }
    public get sprite(): BulletSprite {
        return this._sprite;
    }
    public spawn(canvas: Canvas, entityStorage: IStorage<IEntity>) {
        canvas.insert(this._sprite);
        entityStorage.insert(this._model.entity);
    }
    public vanish(canvas: Canvas, entityStorage: IStorage<IEntity>) {
        canvas.remove(this._sprite);
        entityStorage.remove(this._model.entity);
    }
}