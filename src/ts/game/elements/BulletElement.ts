import {IElement} from "./IElement";
import {IStorage} from "../../model/entitiy/IEntityCollisionSystem";
import {IEntity} from "../../model/entitiy/IEntity";
import {BulletSprite} from "../../sprite/bullet/BulletSprite";
import {BulletModel} from "../../model/bullet/BulletModel";

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
    public spawn(canvas: Element, entityStorage: IStorage<IEntity>) {
        canvas.appendChild(this._sprite.sprite);

        entityStorage.insert(this._model.entity);
    }
}