import {BulletElement} from "../../elements/BulletElement";
import {BulletMovementManager} from "../movement managers/BulletMovementManager";
import {Field} from "../../Field";
import {IElement} from "../../elements/IElement";
import {BulletModel} from "../../../model/bullet/BulletModel";
import {BulletSprite} from "../../../sprite/bullet/BulletSprite";
import {IAnimationManager} from "../AnimationManager";
import {AnimationMaker} from "../../../sprite/animation/AnimationMaker";
import {HandlingManager, IAddModel, IElementManager} from "./HandlingManager";
import {IDTracker} from "../../id/IDTracker";
import {BULLET_ANIMATION_SIZE_INCREASE_COEFF, BULLET_HEIGHT, BULLET_WIDTH} from "../../../constants/gameConstants";
import {Point} from "../../../geometry/Point";
import {BulletImpactAnimation} from "../../../sprite/animation/BulletImpactAnimation";

export class BulletHandlingManager extends HandlingManager<BulletElement, BulletMovementManager> {
    private readonly _handlingManagers: Iterable<IElementManager<IElement>>;
    private readonly _animationManager: IAnimationManager;

    public constructor(bulletManager: BulletMovementManager, field: Field, elements: Map<number, BulletElement>,
                       handlingManagers: Iterable<IElementManager<IElement>>,
                       animationManager: IAnimationManager) {
        super(bulletManager, field, elements, IDTracker.isBullet);
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
                    BULLET_WIDTH[num] * BULLET_ANIMATION_SIZE_INCREASE_COEFF,
                    BULLET_HEIGHT[num] * BULLET_ANIMATION_SIZE_INCREASE_COEFF,
                    num
                )

                const id = collisionPack.id;
                const elementHandling = this.getElementHandling(id);
                const element: IElement | null = elementHandling.get(id);
                if (element) {
                    element.model.takeDamage(bulletCollisionData.bulletElement.model);
                    if (element.model.isDead()) {
                        AnimationMaker.playDeathAnimation(element.model.entity, this._animationManager, this._field.canvas)

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
        this._field.canvas.appendChild(impactAnimation.sprite);
    }
}

export class BulletModelAdder implements IAddModel<BulletModel> {
    private readonly _elements: Map<number, BulletElement>;
    private readonly _field: Field;
    private readonly _bulletMovementManager: BulletMovementManager;
    public constructor(elements: Map<number, BulletElement>, field: Field, bulletMovementManager: BulletMovementManager) {
        this._elements = elements;
        this._field = field;
        this._bulletMovementManager = bulletMovementManager;
    }
    public addBulletModel(bulletModel: BulletModel, num: number) {
        if (!this._elements.has(bulletModel.entity.id)) {
            const bulletElements = new BulletElement(bulletModel, new BulletSprite(num));
            if (this._bulletMovementManager.checkForSpawn(bulletElements)) {
                this._elements.set(bulletElements.id, bulletElements);
                bulletElements.spawn(this._field.canvas, this._bulletMovementManager.entityStorage);
            }
        }
    }
}