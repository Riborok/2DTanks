import {IEntityLifecycle, IPositionAdjustable, IStorage} from "../../additionally/type";
import {ISprite} from "../../sprite/ISprite";
import {ICollectible} from "./ICollectible";
import {IIdentifiable} from "../id/IIdentifiable";
import {Point} from "../../geometry/Point";

export interface ICollectibleItem extends IIdentifiable, IPositionAdjustable, IEntityLifecycle<ISprite, ICollectible>{
    get collectible(): ICollectible;
    get sprite(): ISprite;
}

export class CollectibleItem implements ICollectibleItem {
    private readonly _collectible: ICollectible;
    private readonly _sprite: ISprite;
    public constructor(collectible: ICollectible, sprite: ISprite) {
        this._collectible = collectible;
        this._sprite = sprite;
    }
    public get id(): number {
        return this._collectible.id;
    }
    public get collectible(): ICollectible {
        return this._collectible;
    }
    public get sprite(): ISprite {
        return this._sprite;
    }
    public spawn(spriteStorage: IStorage<ISprite>, entityStorage: IStorage<ICollectible>) {
        spriteStorage.insert(this._sprite);
        entityStorage.insert(this._collectible);
    }
    public terminate(spriteStorage: IStorage<ISprite>, entityStorage: IStorage<ICollectible>) {
        spriteStorage.remove(this._sprite);
        entityStorage.remove(this._collectible);
    }
    public adjustPosition(point: Point, angle: number) {
        this._collectible.adjustPolygon(point, this._sprite.width, this._sprite.height, angle);
        this._sprite.point = point;
        this._sprite.angle = angle;
    }
}