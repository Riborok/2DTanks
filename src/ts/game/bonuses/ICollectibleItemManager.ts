import {ICollectibleItem} from "./ICollectibleItem";
import {ISprite} from "../../sprite/ISprite";
import {ICollectible} from "./ICollectible";
import {IElement} from "../elements/IElement";
import {ICollisionSystem, Quadtree} from "../../polygon/ICollisionSystem";
import {CollisionChecker, GetCollisionChecker, ICollisionChecker} from "../managers/ICollisionChecker";
import {IRulesManager, IStorage, Size} from "../../additionally/type";

export interface IBonusCollisionManager {
    checkForBonusHits(element: IElement): void;
}
export interface ICollectibleManager {
    addElements(elements: Iterable<ICollectibleItem>): void;
    addElement(element: ICollectibleItem): void;
}

export interface ICollectibleItemManager extends ICollectibleManager, IBonusCollisionManager, GetCollisionChecker<ICollectible> {
}

export class CollectibleItemManager implements ICollectibleItemManager {
    private readonly _items: Map<number, ICollectibleItem> = new Map<number, ICollectibleItem>();
    private readonly _spriteStorage: IStorage<ISprite>;
    private readonly _collectibleStorage: IStorage<ICollectible>;
    private readonly _rulesManager: IRulesManager;
    private readonly _collisionDetector: ICollisionChecker<ICollectible>;
    get collisionChecker(): ICollisionChecker<ICollectible> { return this._collisionDetector }
    public constructor(spriteStorage: IStorage<ISprite>, rulesManager: IRulesManager, size: Size) {
        this._spriteStorage = spriteStorage;
        const collisionSystem: ICollisionSystem<ICollectible> = new Quadtree(0, 0, size.width, size.height)
        this._collectibleStorage = collisionSystem;
        this._collisionDetector = new CollisionChecker(collisionSystem);
        this._rulesManager = rulesManager;
    }
    public addElements(elements: Iterable<ICollectibleItem>) {
        for (const element of elements)
            this.addElement(element);
    }
    public addElement(element: ICollectibleItem) {
        if (!this._items.has(element.id)) {
            this._items.set(element.id, element);
            element.spawn(this._spriteStorage, this._collectibleStorage);
        }
    }
    public checkForBonusHits(element: IElement) {
        const collectibles = this._collisionDetector.hasCollision(element.model.entity);
        if (collectibles) {
            for (const collectible of collectibles) {
                if (this._rulesManager.addBonus(element, collectible.bonus))
                    this.delete(this._items.get(collectible.id));
            }
        }
    }
    private delete(element: ICollectibleItem) {
        this._items.delete(element.id);
        element.terminate(this._spriteStorage, this._collectibleStorage);
    }
}