import {BulletElement} from "../../elements/BulletElement";
import {BulletMovementManager} from "../movement managers/BulletMovementManager";
import {IElement} from "../../elements/IElement";
import {BulletModel} from "../../../model/bullet/BulletModel";
import {BulletSprite} from "../../../sprite/bullet/BulletSprite";
import {IAnimationManager} from "../AnimationManager";
import {AnimationMaker} from "../../../sprite/animation/AnimationMaker";
import {HandlingManager, IAddModel, IElementManager} from "./HandlingManager";
import {ModelIDTracker} from "../../id/ModelIDTracker";
import {BULLET_ANIMATION_SIZE_INCREASE_COEFF, ResolutionManager} from "../../../constants/gameConstants";
import {Point} from "../../../geometry/Point";
import {BulletImpactAnimation} from "../../../sprite/animation/BulletImpactAnimation";
import {IStorage} from "../../../additionally/type";
import {ISprite} from "../../../sprite/Sprite";

export class BulletHandlingManager extends HandlingManager<BulletElement, BulletMovementManager> {
    private readonly _handlingManagers: Iterable<IElementManager<IElement>>;
    private readonly _animationManager: IAnimationManager;

    public constructor(bulletManager: BulletMovementManager, storage: IStorage<ISprite>, elements: Map<number, BulletElement>,
                       handlingManagers: Iterable<IElementManager<IElement>>,
                       animationManager: IAnimationManager) {
        super(bulletManager, storage, elements, ModelIDTracker.isBullet);
        this._handlingManagers = handlingManagers;
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

        if (this._movementManager.bulletCollisionDates.hasForProcessing())
            this.handleBulletCollisions();
    }
    private handleBulletCollisions() {
        for (const bulletCollisionData of this._movementManager.bulletCollisionDates.iterable) {
            for (const collisionPack of bulletCollisionData.collisionPacks) {
                const num: number = bulletCollisionData.bulletElement.sprite.num;
                this.playImpactAnimation(
                    collisionPack.collisionPoint,
                    bulletCollisionData.bulletElement.model.entity.angle + Math.PI,
                    ResolutionManager.BULLET_WIDTH[num] * BULLET_ANIMATION_SIZE_INCREASE_COEFF,
                    ResolutionManager.BULLET_HEIGHT[num] * BULLET_ANIMATION_SIZE_INCREASE_COEFF,
                    num
                )

                const id = collisionPack.id;
                const elementHandling = this.getElementHandling(id);
                const element: IElement | null = elementHandling.get(id);
                if (element) {
                    element.model.takeDamage(bulletCollisionData.bulletElement.model);
                    if (element.model.isDead()) {
                        AnimationMaker.playDeathAnimation(element.model.entity, this._animationManager)

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
    private playImpactAnimation(point: Point, angle: number, width: number, height: number, num: number){
        const impactAnimation = new BulletImpactAnimation(point, angle, width, height, num);
        this._animationManager.add(impactAnimation);
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