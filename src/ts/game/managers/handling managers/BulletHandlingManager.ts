import {
    HandlingManagers,
    IAddModel,
    IBulletHandlingManager,
    IElementHandling,
    ITankHandlingManager,
    IWallHandlingManager
} from "./HandlingManagers";
import {BulletElement} from "../../elements/BulletElement";
import {BulletMovementManager} from "../movement managers/BulletMovementManager";
import {Field} from "../../Field";
import {IElement} from "../../elements/IElement";
import {IDTracker} from "../../id/IDTracker";
import {BulletModel} from "../../../model/bullet/BulletModel";
import {BulletSprite} from "../../../sprite/bullet/BulletSprite";
import {IStorage} from "../../../entitiy/IEntityCollisionSystem";
import {IEntity} from "../../../entitiy/IEntity";

export class BulletHandlingManager extends HandlingManagers<BulletElement, BulletMovementManager> implements IBulletHandlingManager {
    private readonly _tankHandlingManager: ITankHandlingManager;
    private readonly _wallHandlingManager: IWallHandlingManager;

    public constructor(bulletManager: BulletMovementManager, field: Field, elements: Map<number, BulletElement>,
                       tankHandlingManager: ITankHandlingManager, wallHandlingManager: IWallHandlingManager) {
        super(bulletManager, field, elements);
        this._tankHandlingManager = tankHandlingManager;
        this._wallHandlingManager = wallHandlingManager;
    }

    public handle(deltaTime: number): void {
        if (this._elements.size !== 0) {
            const elementsToDelete = new Array<BulletElement>();

            for (const element of this._elements.values()) {
                this._movementManager.movement(element, deltaTime);
                if (!this._movementManager.hasResidualMovement(element))
                    elementsToDelete.push(element);
            }

            for (const elementToDelete of elementsToDelete)
                this.delete(elementToDelete);
        }

        if (this._movementManager.bulletAndModelIDs.hasForProcessing())
            this.handleBulletCollisions();
    }
    private handleBulletCollisions() {
        for (const bulletAndModelID of this._movementManager.bulletAndModelIDs.iterable) {
            for (const id of bulletAndModelID.elementsIds) {
                const elementHandling = this.getElementHandling(id);
                const element = elementHandling.elements.get(id);
                element.model.takeDamage(bulletAndModelID.bulletElement.model);
                if (element.model.isDead())
                    elementHandling.delete(element);
            }
            this.delete(bulletAndModelID.bulletElement);
        }

        this._movementManager.bulletAndModelIDs.clear();
    }
    private getElementHandling(id: number): IElementHandling<IElement> {
        if (IDTracker.isWall(id))
            return this._wallHandlingManager;

        if (IDTracker.isTank(id))
            return this._tankHandlingManager;

        if (IDTracker.isBullet(id))
            return this;
    }
}

export class BulletModelAdder implements IAddModel<BulletModel> {
    private readonly _elements: Map<number, BulletElement>;
    private readonly _field: Field;
    private readonly _storage: IStorage<IEntity>;
    public constructor(elements: Map<number, BulletElement>, field: Field, storage: IStorage<IEntity>) {
        this._elements = elements;
        this._field = field;
        this._storage = storage;
    }
    public addBulletModel(bulletModel: BulletModel, num: number) {
        if (!this._elements.has(bulletModel.entity.id)) {
            const bulletElements = new BulletElement(bulletModel, new BulletSprite(num));
            this._elements.set(bulletElements.id, bulletElements);
            bulletElements.spawn(this._field.canvas, this._storage);
        }
    }
}