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
import {AnimationManager} from "../AnimationManager";
import {AnimationMaker} from "../../../sprite/animation/AnimationMaker";
import {IBulletMovementManager} from "../movement managers/MovementManager";

export class BulletHandlingManager extends HandlingManagers<BulletElement, BulletMovementManager> implements IBulletHandlingManager {
    private readonly _tankHandlingManager: ITankHandlingManager;
    private readonly _wallHandlingManager: IWallHandlingManager;
    private readonly _animationManager: AnimationManager;

    public constructor(bulletManager: BulletMovementManager, field: Field, elements: Map<number, BulletElement>,
                       tankHandlingManager: ITankHandlingManager, wallHandlingManager: IWallHandlingManager,
                       animationManager: AnimationManager) {
        super(bulletManager, field, elements);
        this._tankHandlingManager = tankHandlingManager;
        this._wallHandlingManager = wallHandlingManager;
        this._animationManager = animationManager;
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
            for (const collisionPack of bulletAndModelID.collisionPacks) {
                const id = collisionPack.id;
                const elementHandling = this.getElementHandling(id);
                const element: IElement | null = elementHandling.get(id);
                if (element) {
                    element.model.takeDamage(bulletAndModelID.bulletElement.model);
                    if (element.model.isDead()) {
                        AnimationMaker.playDeathAnimation(element.model.entity, this._animationManager, this._field.canvas)

                        elementHandling.delete(element);
                    }
                }
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
    private readonly _bulletMovementManager: IBulletMovementManager;
    public constructor(elements: Map<number, BulletElement>, field: Field, bulletMovementManager: IBulletMovementManager) {
        this._elements = elements;
        this._field = field;
        this._bulletMovementManager = bulletMovementManager;
    }
    public addBulletModel(bulletModel: BulletModel, num: number) {
        if (!this._elements.has(bulletModel.entity.id)) {
            const bulletElements = new BulletElement(bulletModel, new BulletSprite(num));
            this._bulletMovementManager.checkForSpawn(bulletElements);
            this._elements.set(bulletElements.id, bulletElements);
            bulletElements.spawn(this._field.canvas, this._bulletMovementManager.entityStorage);
        }
    }
}