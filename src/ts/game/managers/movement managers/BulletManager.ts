import {IBulletManager, MovementManager} from "./MovementManager";
import {BulletElement} from "../../elements/BulletElement";
import {IEntity} from "../../../model/entitiy/IEntity";
import {IdToProcessing, IIdToProcessing} from "../IdToProcessing";

export class BulletManager extends MovementManager implements IBulletManager {
    private readonly _bulletAndModelIDs: IIdToProcessing = new IdToProcessing();
    public get bulletAndModelIDs(): IIdToProcessing { return this._bulletAndModelIDs }
    public hasResidualMovement(bulletElement: BulletElement): boolean {
        return !bulletElement.model.isIdle();
    }
    public movement(bulletElement: BulletElement) {
        if (!bulletElement.model.isIdle())
            this.update(bulletElement);
    }
    private update(bulletElement: BulletElement) {
        const entity = bulletElement.model.entity;
        this._entityStorage.remove(entity);
        bulletElement.model.residualMovement(this._resistanceCoeff, this._airResistanceCoeff);
        const collisions: Iterable<IEntity> | null = this._collisionManager.hasCollision(entity);
        if (collisions) {
            this._bulletAndModelIDs.push(bulletElement.id);
            for (const collision of collisions)
                this._bulletAndModelIDs.push(collision.id);
        }

        bulletElement.sprite.updateAfterAction(entity.points[0], entity.angle);

        this._entityStorage.insert(entity);
    }
}