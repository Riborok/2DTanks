import {ICollectibleItem} from "./ICollectibleItem";
import {ICollisionManager, IRulesManager, IStorage, Size} from "../../additionally/type";
import {ISprite} from "../../sprite/ISprite";
import {ICollectible} from "./ICollectible";
import {IElement} from "../elements/IElement";
import {ICollisionSystem, Quadtree} from "../../polygon/ICollisionSystem";
import {BonusCollisionManager} from "./BonusCollisionManager";

export interface IBonusCollisionChecker {
    checkForBonusHits(element: IElement): void;
}
export interface ICollectibleManager {
    add(elements: Iterable<ICollectibleItem>): void;
}

export interface ICollectibleItemManager extends ICollectibleManager, IBonusCollisionChecker {
}

export class CollectibleItemManager implements ICollectibleItemManager {
    private readonly _items: Map<number, ICollectibleItem> = new Map<number, ICollectibleItem>();
    private readonly _spriteStorage: IStorage<ISprite>;
    private readonly _collectibleStorage: IStorage<ICollectible>;
    private readonly _rulesManager: IRulesManager;
    private readonly _collisionManager: ICollisionManager<ICollectible>;
    public constructor(spriteStorage: IStorage<ISprite>, rulesManager: IRulesManager, size: Size) {
        this._spriteStorage = spriteStorage;
        const collisionSystem: ICollisionSystem<ICollectible> = new Quadtree(0, 0, size.width, size.height)
        this._collectibleStorage = collisionSystem;
        this._collisionManager = new BonusCollisionManager(collisionSystem);
        this._rulesManager = rulesManager;
    }
    public add(elements: Iterable<ICollectibleItem>) {
        for (const element of elements) {
            if (!this._items.has(element.id)) {
                this._items.set(element.id, element);
                element.spawn(this._spriteStorage, this._collectibleStorage);
            }
        }
    }
    public checkForBonusHits(element: IElement) {
        for (const collectible of this._collisionManager.hasCollision(element.model.entity)) {
            if (this._rulesManager.addBonus(element, collectible.bonus))
                this.delete(this._items.get(collectible.id));
        }
    }
    private delete(element: ICollectibleItem) {
        this._items.delete(element.id);
        element.terminate(this._spriteStorage, this._collectibleStorage);
    }
}