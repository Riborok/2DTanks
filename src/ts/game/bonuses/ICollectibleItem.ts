import {IEntityLifecycle, IStorage} from "../../additionally/type";
import {ISprite} from "../../sprite/ISprite";
import {ICollectible} from "./ICollectible";
import {IIdentifiable} from "../id/IIdentifiable";

export interface ICollectibleItem extends IIdentifiable, IEntityLifecycle<ISprite, ICollectible>{
    get collectible(): ICollectible;
    get sprite(): ISprite;
}

export class CollectibleItem implements ICollectibleItem {
    private readonly _collectible: ICollectible;
    private readonly _sprite: ISprite;
    private readonly _id: number;
    public constructor(collectible: ICollectible, sprite: ISprite) {
        this._collectible = collectible;
        this._sprite = sprite;
        this._id = collectible.id;
    }
    public get id(): number {
        return this._id;
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
}