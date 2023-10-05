import {BulletElement} from "../../elements/BulletElement";
import {BulletMovementManager} from "../movement managers/BulletMovementManager";
import {IElement} from "../../elements/IElement";
import {IAnimationManager} from "../animation managers/AnimationManager";
import {HandlingManager, IAddElement, IElementManager} from "./HandlingManager";
import {ModelIDTracker} from "../../id/ModelIDTracker";
import {BulletCollisionData, IKillProcessor, IStorage} from "../../../additionally/type";
import {ISprite} from "../../../sprite/ISprite";
import {BulletAnimator, IBulletAnimator} from "../animation managers/Animators";
import {IHealthDrawManager} from "../additional/IHealthBarManager";
import {getFirstElement, getRandomInt} from "../../../additionally/additionalFunc";
import {ResolutionManager} from "../../../constants/gameConstants";
import {IExplosiveBullet} from "../../../components/bullet/IBullet";

export class BulletHandlingManager extends HandlingManager<BulletElement, BulletMovementManager> {
    private readonly _handlingManagers: Iterable<IElementManager<IElement>>;
    private readonly _bulletAnimator: IBulletAnimator;
    private readonly _killProcessor: IKillProcessor;
    private readonly _healthManager: IHealthDrawManager;

    public constructor(bulletManager: BulletMovementManager, storage: IStorage<ISprite>, elements: Map<number, BulletElement>,
                       handlingManagers: Iterable<IElementManager<IElement>>, animationManager: IAnimationManager,
                       killProcessor: IKillProcessor, healthManager: IHealthDrawManager) {
        super(bulletManager, storage, elements, ModelIDTracker.isBullet);
        this._handlingManagers = handlingManagers;
        this._bulletAnimator = new BulletAnimator(animationManager);
        this._killProcessor = killProcessor;
        this._healthManager = healthManager;
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
            this.handleBulletDeletion(bulletCollisionData);
            this.handleExplosiveBullet(bulletCollisionData);
            this.handleCollisionPacks(bulletCollisionData);
        }
        this._movementManager.bulletCollisionDates.clear();
    }
    private handleCollisionPacks(bulletCollisionData: BulletCollisionData) {
        for (const collisionPack of bulletCollisionData.collisionPacks) {
            const id = collisionPack.id;
            const elementHandling = this.getElementHandling(id);
            const element: IElement | null = elementHandling.get(id);
            if (element) {
                element.model.takeDamage(bulletCollisionData.bulletElement.model);

                if (element.model.isDead()) {
                    elementHandling.delete(element);
                    this._bulletAnimator.createDeadAnimation(collisionPack.collisionPoint, element);

                    this._healthManager.remove(element.model);

                    this._killProcessor.processKill(bulletCollisionData.bulletElement.source, element);
                }
                else
                    this._healthManager.add(element.model);
            }
        }
    }
    private handleExplosiveBullet(bulletCollisionData: BulletCollisionData) {
        const firstCollisionPoint = getFirstElement(bulletCollisionData.collisionPacks).collisionPoint;
        const explosionBullet: IExplosiveBullet | null = bulletCollisionData.bulletElement.model.isExplosiveBullet;

        if (explosionBullet) {
            const size = ResolutionManager.GRENADE_EXPLOSION_SIZE + getRandomInt(-30, 30);
            const angle = getRandomInt(-Math.PI, Math.PI);
            this._bulletAnimator.createExplosionAnimation(firstCollisionPoint, size, angle);
            const affectedArea = explosionBullet.createAffectedArea(firstCollisionPoint, size, angle);
            bulletCollisionData.collisionPacks = this._movementManager.collisionResolver.resolveCollision(affectedArea);
        }
        else
            this._bulletAnimator.createImpactAnimation(firstCollisionPoint, bulletCollisionData.bulletElement);
    }
    private handleBulletDeletion(bulletCollisionData: BulletCollisionData) {
        this.delete(bulletCollisionData.bulletElement);
        this._healthManager.remove(bulletCollisionData.bulletElement.model);
    }
    private getElementHandling(id: number): IElementManager<IElement> {
        for (const handlingManager of this._handlingManagers)
            if (handlingManager.isResponsibleFor(id))
                return handlingManager;
    }
}

export class BulletModelAdder implements IAddElement<BulletElement> {
    private readonly _elements: Map<number, BulletElement>;
    private readonly _storage: IStorage<ISprite>;
    private readonly _bulletMovementManager: BulletMovementManager;
    public constructor(elements: Map<number, BulletElement>, storage: IStorage<ISprite>, bulletMovementManager: BulletMovementManager) {
        this._elements = elements;
        this._storage = storage;
        this._bulletMovementManager = bulletMovementManager;
    }
    public addElement(bulletElement: BulletElement) {
        if (!this._elements.has(bulletElement.id)) {
            if (this._bulletMovementManager.checkForSpawn(bulletElement)) {
                this._elements.set(bulletElement.id, bulletElement);
                bulletElement.spawn(this._storage, this._bulletMovementManager.entityStorage);
            }
        }
    }
}