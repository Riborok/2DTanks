import {HandlingManagers, IAddBulletModel, ITankHandlingManager} from "./HandlingManagers";
import {TankElement} from "../../elements/TankElement";
import {TankMovementManager} from "../movement managers/TankMovementManager";
import {ITireTracksManager, TireTracksManager} from "../TireTracksManager";
import {Field} from "../../Field";
import {BulletModel} from "../../../model/bullet/BulletModel";

export class TankHandlingManager extends HandlingManagers<TankElement, TankMovementManager> implements ITankHandlingManager {
    private readonly _tireTracksManager: ITireTracksManager = new TireTracksManager();
    private readonly _addBulletElement: IAddBulletModel;
    public constructor(bulletManager: TankMovementManager, field: Field, elements: Map<number, TankElement>,
                       addBulletElement: IAddBulletModel) {
        super(bulletManager, field, elements);
        this._addBulletElement = addBulletElement;
    }
    public handle(mask: number): void {
        this._tireTracksManager.reduceOpacity();

        for (const tankElement of this._elements.values()) {
            const control = tankElement.control;

            let action = (mask & control.turretClockwiseMask) !== 0;
            let oppositeAction = (mask & control.turretCounterClockwiseMask) !== 0;
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.turretClockwiseMovement(tankElement);
                else if (oppositeAction)
                    this._movementManager.turretCounterclockwiseMovement(tankElement);
            }

            action = (mask & control.forwardMask) !== 0;
            oppositeAction = (mask & control.backwardMask) !== 0;
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.forwardMovement(tankElement);
                else if (oppositeAction) {
                    tankElement.sprite.removeAcceleration();
                    this._movementManager.backwardMovement(tankElement);
                }
            }
            else {
                tankElement.sprite.removeAcceleration();
                this._movementManager.residualMovement(tankElement);
            }

            action = (mask & control.hullClockwiseMask) !== 0;
            oppositeAction = (mask & control.hullCounterClockwiseMask) !== 0;
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.hullClockwiseMovement(tankElement);
                else if (oppositeAction)
                    this._movementManager.hullCounterclockwiseMovement(tankElement);
            }
            else
                this._movementManager.residualAngularMovement(tankElement);

            action = (mask & control.shoot) !== 0;
            if (action) {
                const bulletModel: BulletModel | null = tankElement.model.shot();
                if (bulletModel)
                    this._addBulletElement.addBulletModel(bulletModel);
            }
        }
    }
    public add(elements: Iterable<TankElement>) {
        super.add(elements);
        for (const element of elements) {
            const sprite = element.sprite;

            const entity = element.model.entity;
            sprite.spawnTireTracks(this._field.canvas, entity.points[0], entity.angle,
                this._tireTracksManager.vanishingListOfTirePairs);

            const hullSprite = sprite.tankSpriteParts.hullSprite;
            sprite.spawnTankAcceleration(this._field.canvas, hullSprite.accelerationEffectIndentX, hullSprite.height);
        }
    }
}