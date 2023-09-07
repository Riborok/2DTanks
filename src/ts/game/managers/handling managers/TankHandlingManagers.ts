import {HandlingManagers, ITankHandlingManagers} from "./HandlingManagers";
import {TankElement} from "../../elements/TankElement";
import {TankMovementManager} from "../movement managers/TankMovementManager";
import {ITireTracksManager, TireTracksManager} from "../TireTracksManager";

export class TankHandlingManagers extends HandlingManagers<TankElement, TankMovementManager> implements ITankHandlingManagers {
    private readonly _tireTracksManager: ITireTracksManager = new TireTracksManager();
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