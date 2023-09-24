import {ICollectibleItem} from "./ICollectibleItem";
import {ICollisionManager, IRulesManager, IStorage} from "../../additionally/type";
import {ISprite} from "../../sprite/ISprite";
import {ICollectible} from "./ICollectible";
import {IElement} from "../elements/IElement";

export interface ICollectibleManager {

}

export class CollectibleManager implements ICollectibleManager {
    private readonly _items: Map<number, ICollectibleItem>;
    private readonly _spriteStorage: IStorage<ISprite>;
    private readonly _collectibleStorage: IStorage<ICollectible>;
    private readonly _rulesManager: IRulesManager;
    private readonly _collisionManager: ICollisionManager<ICollectible>;
    public add(...elements: ICollectibleItem[]) {
        for (const element of elements) {
            if (!this._items.has(element.id)) {
                this._items.set(element.id, element);
                element.spawn(this._spriteStorage, this._collectibleStorage);
            }
        }
    }
    public checkForBonusHits(element: IElement) {
        for (const collectible of this._collisionManager.hasCollision(element.model.entity)) {
            this._rulesManager.addBonus(element, collectible.bonus);
            this.delete(this._items.get(collectible.id));
        }
    }
    private delete(element: ICollectibleItem) {
        this._items.delete(element.id);
        element.terminate(this._spriteStorage, this._collectibleStorage);
    }
}