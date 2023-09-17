import {IBulletMovementManager, MovementManager} from "./MovementManager";
import {BulletElement} from "../../elements/BulletElement";
import {IdToProcessing, IIdToProcessing} from "../IdToProcessing";
import {BulletCollisionData, CollisionPack} from "../../../additionally/type";
import {RectangularEntityManipulator} from "../../../entitiy/RectangularEntityManipulator";

export class BulletMovementManager extends MovementManager implements IBulletMovementManager {
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

        // Store the current velocity vector of the entity to ensure that
        // if it changes, is uses the original velocity vector
        const velocity = entity.velocity.clone();

        // Move the rectangular entity's front part based on its current velocity
        RectangularEntityManipulator.movementFront(entity, velocity);

        // Check for collisions. Since the bullet's acceleration may be larger than its size, move it
        // in two steps to ensure accurate collision detection between its initial and final positions
        const collisionPacks: Iterable<CollisionPack> | null = this._collisionManager.hasCollision(entity);

        // Move the rectangular entity's back part to its final position
        RectangularEntityManipulator.movementBack(entity, velocity);
        if (collisionPacks)
            this._bulletAndModelIDs.push({ bulletElement: bulletElement, collisionPacks: collisionPacks });

        bulletElement.sprite.updateAfterAction(entity.points[0], entity.angle);

        this._entityStorage.insert(entity);
    }
    public checkForSpawn(bulletElement: BulletElement): boolean {
        const entity = bulletElement.model.entity;

        const collisionPacks: Iterable<CollisionPack> | null = this._collisionManager.hasCollision(entity);
        if (collisionPacks) {
            this._bulletAndModelIDs.push({bulletElement: bulletElement, collisionPacks: collisionPacks});
            return false;
        }

        bulletElement.sprite.updateAfterAction(entity.points[0], entity.angle);
        return true;
    }
}