import {IBulletManager, MovementManager} from "./MovementManager";
import {BulletElement} from "../../elements/BulletElement";
import {IEntity} from "../../../entitiy/IEntity";
import {IdToProcessing, IIdToProcessing} from "../IdToProcessing";
import {BulletCollisionData} from "../../../additionally/type";
import {EntityManipulator} from "../../../entitiy/EntityManipulator";

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
        EntityManipulator.movement(entity);
        const collisions: Iterable<IEntity> | null = this._collisionManager.hasCollision(entity);
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