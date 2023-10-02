import {IElement} from "./IElement";
import {IEntity} from "../../polygon/entity/IEntity";
import {BulletSprite} from "../../sprite/bullet/BulletSprite";
import {IBulletModel} from "../../model/bullet/IBulletModel";
import {IAmmo, IStorage} from "../../additionally/type";
import {ISprite} from "../../sprite/ISprite";

export class BulletElement implements IElement, IAmmo {
    private readonly _model: IBulletModel;
    private readonly _sprite: BulletSprite;
    private readonly _source: IElement;
    public constructor(model: IBulletModel, num: number, source: IElement) {
        this._model = model;
        this._sprite = new BulletSprite(num);
        this._source = source;
    }
    public get id(): number {
        return this._model.entity.id;
    }
    public get model(): IBulletModel {
        return this._model;
    }
    public get sprite(): BulletSprite {
        return this._sprite;
    }
    public spawn(spriteStorage: IStorage<ISprite>, entityStorage: IStorage<IEntity>) {
        spriteStorage.insert(this._sprite);
        entityStorage.insert(this._model.entity);
    }
    public terminate(spriteStorage: IStorage<ISprite>, entityStorage: IStorage<IEntity>) {
        spriteStorage.remove(this._sprite);
        entityStorage.remove(this._model.entity);
    }
    public get source(): IElement {
        return this._source;
    }
}