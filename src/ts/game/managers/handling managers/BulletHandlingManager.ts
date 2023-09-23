import {BulletElement} from "../../elements/BulletElement";
import {BulletMovementManager} from "../movement managers/BulletMovementManager";
import {IElement} from "../../elements/IElement";
import {BulletModel} from "../../../model/bullet/BulletModel";
import {BulletSprite} from "../../../sprite/bullet/BulletSprite";
import {IAnimationManager} from "../animation managers/AnimationManager";
import {HandlingManager, IAddModel, IElementManager} from "./HandlingManager";
import {ModelIDTracker} from "../../id/ModelIDTracker";
import {IStorage} from "../../../additionally/type";
import {ISprite} from "../../../sprite/ISprite";
import {BulletAnimator, IBulletAnimator} from "../animation managers/Animators";

export class BulletHandlingManager extends HandlingManager<BulletElement, BulletMovementManager> {
    private readonly _handlingManagers: Iterable<IElementManager<IElement>>;
    private readonly _bulletAnimator: IBulletAnimator;

    public constructor(bulletManager: BulletMovementManager, storage: IStorage<ISprite>, elements: Map<number, BulletElement>,
                       handlingManagers: Iterable<IElementManager<IElement>>,
                       animationManager: IAnimationManager) {
        super(bulletManager, storage, elements, ModelIDTracker.isBullet);
        this._handlingManagers = handlingManagers;
        this._bulletAnimator = new BulletAnimator(animationManager);
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

        if (this._movementManager.bulletCollisionDates.hasForProcessing())
            this.handleBulletCollisions();
    }
    private handleBulletCollisions() {
        for (const bulletCollisionData of this._movementManager.bulletCollisionDates.iterable) {
            for (const collisionPack of bulletCollisionData.collisionPacks) {
                this._bulletAnimator.createImpactAnimation(collisionPack.collisionPoint, bulletCollisionData.bulletElement);

                const id = collisionPack.id;
                const elementHandling = this.getElementHandling(id);
                const element: IElement | null = elementHandling.get(id);
                if (element) {
                    element.model.takeDamage(bulletCollisionData.bulletElement.model);
                    if (element.model.isDead()) {
                        this._bulletAnimator.createDeadAnimation(element);

                        elementHandling.delete(element);
                    }
                }
            }
            this.delete(bulletCollisionData.bulletElement);
        }

        this._movementManager.bulletCollisionDates.clear();
    }
    private getElementHandling(id: number): IElementManager<IElement> {
        for (const handlingManager of this._handlingManagers)
            if (handlingManager.isResponsibleFor(id))
                return handlingManager;
    }
}

export class BulletModelAdder implements IAddModel<BulletModel> {
    private readonly _elements: Map<number, BulletElement>;
    private readonly _storage: IStorage<ISprite>;
    private readonly _bulletMovementManager: BulletMovementManager;
    public constructor(elements: Map<number, BulletElement>, storage: IStorage<ISprite>, bulletMovementManager: BulletMovementManager) {
        this._elements = elements;
        this._storage = storage;
        this._bulletMovementManager = bulletMovementManager;
    }
    public addBulletModel(bulletModel: BulletModel, num: number) {
        if (!this._elements.has(bulletModel.entity.id)) {
            const bulletElements = new BulletElement(bulletModel, new BulletSprite(num));
            if (this._bulletMovementManager.checkForSpawn(bulletElements)) {
                this._elements.set(bulletElements.id, bulletElements);
                bulletElements.spawn(this._storage, this._bulletMovementManager.entityStorage);
            }
        }
    }
}