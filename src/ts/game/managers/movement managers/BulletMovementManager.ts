import {IBulletMovementManager, MovementManager} from "./MovementManager";
import {BulletElement} from "../../elements/BulletElement";
import {IdToProcessing, IIdToProcessing} from "../IdToProcessing";
import {BulletCollisionData, ModelCollisionPack} from "../../../additionally/type";
import {VectorUtils} from "../../../geometry/VectorUtils";
import {PolygonManipulator} from "../../../polygon/PolygonManipulator";

export class BulletMovementManager extends MovementManager implements IBulletMovementManager {
    private readonly _bulletCollisionDates: IIdToProcessing<BulletCollisionData> = new IdToProcessing();
    public get bulletCollisionDates(): IIdToProcessing<BulletCollisionData> { return this._bulletCollisionDates }
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

        // Calculate the movement vector based on the bullet's current velocity and movement length.
        const movementVector= VectorUtils.createFromAngleAndLength(entity.velocity.angle, entity.movementLength);

        // Move the bullet along its movement length (i times) to ensure accurate collision detection. and
        // address any other potential issues. If a collision is detected, break out of the loop to stop movement.
        let isCollisionOccurred = false;
        const count = Math.floor(VectorUtils.calcCoDirectionalScaleFactor(entity.velocity, movementVector));
        for (let i = count; i > 0; i--) {
            PolygonManipulator.movePolygon(entity, movementVector);
            const collisionPacks: Iterable<ModelCollisionPack> | null = this._collisionManager.hasCollision(entity);
            if (collisionPacks) {
                this._bulletCollisionDates.push({ bulletElement: bulletElement, collisionPacks: collisionPacks });
                isCollisionOccurred = true;
                break;
            }
        }

        // If no collision occurred during the movement, move the bullet by the remaining distance
        // (previously it moved by the floor value).
        if (!isCollisionOccurred) {
            // Calculate the remaining displacement vector: entity.velocity - count * movementVector.
            movementVector.scale(-count);
            movementVector.addVector(entity.velocity);

            PolygonManipulator.movePolygon(entity, movementVector);
            const collisionPacks: Iterable<ModelCollisionPack> | null = this._collisionManager.hasCollision(entity);
            if (collisionPacks)
                this._bulletCollisionDates.push({ bulletElement: bulletElement, collisionPacks: collisionPacks });
        }

        bulletElement.sprite.updateAfterAction(entity.points[0], entity.angle);
        this._entityStorage.insert(entity);
    }
    public checkForSpawn(bulletElement: BulletElement): boolean {
        const entity = bulletElement.model.entity;

        const collisionPacks: Iterable<ModelCollisionPack> | null = this._collisionManager.hasCollision(entity);
        if (collisionPacks) {
            this._bulletCollisionDates.push({ bulletElement: bulletElement, collisionPacks: collisionPacks });
            return false;
        }

        bulletElement.sprite.updateAfterAction(entity.points[0], entity.angle);
        return true;
    }
}