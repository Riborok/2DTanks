import {IBulletManager, MovementManager} from "./MovementManager";
import {BulletElement} from "../../elements/BulletElement";
import {IEntity} from "../../../entitiy/IEntity";
import {IdToProcessing, IIdToProcessing} from "../IdToProcessing";
import {BulletCollisionData} from "../../../additionally/type";
import {RectangularEntityManipulator} from "../../../entitiy/RectangularEntityManipulator";

export class BulletMovementManager extends MovementManager implements IBulletManager {
    private readonly _bulletAndModelIDs: IIdToProcessing<BulletCollisionData> = new IdToProcessing();
    public get bulletAndModelIDs(): IIdToProcessing<BulletCollisionData> { return this._bulletAndModelIDs }
    public hasResidualMovement(bulletElement: BulletElement): boolean {
        return !bulletElement.model.isIdle();
    }
    public movement(bulletElement: BulletElement, deltaTime: number) {
        if (!bulletElement.model.isIdle())
            this.update(bulletElement, deltaTime);
    }
    private update(bulletElement: BulletElement, deltaTime: number) {
        const entity = bulletElement.model.entity;
        this._entityStorage.remove(entity);
        bulletElement.model.residualMovement(this._airResistanceCoeff, deltaTime);

        // Move the rectangular entity's front part based on its current velocity
        RectangularEntityManipulator.movementFront(entity);

        // Check for collisions. Since the bullet's acceleration may be larger than its size, move it
        // in two steps to ensure accurate collision detection between its initial and final positions
        const collisions: Iterable<IEntity> | null = this._collisionManager.hasCollision(entity);

        // Move the rectangular entity's back part to its final position
        RectangularEntityManipulator.movementBack(entity);
        if (collisions) {
            const collisionsIds = new Array<number>();
            for (const collision of collisions)
                collisionsIds.push(collision.id);
            this._bulletAndModelIDs.push({ bulletElement: bulletElement, elementsIds: collisionsIds });
        }

        bulletElement.sprite.updateAfterAction(entity.points[0], entity.angle);

        this._entityStorage.insert(entity);
    }
}