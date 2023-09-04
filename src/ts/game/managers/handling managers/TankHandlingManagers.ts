import {HandlingManagers, ITankHandlingManagers} from "./HandlingManagers";
import {TankElement} from "../../elements/TankElement";
import {TankMovementManager} from "../movement managers/TankMovementManager";
import {ITireTracksManager} from "../TireTracksManager";
import {Field} from "../../Field";

export class TankHandlingManagers extends HandlingManagers<TankElement, TankMovementManager> implements ITankHandlingManagers {
    private readonly _tireTracksManager: ITireTracksManager;
    public constructor(elements: TankElement[], movementManager: TankMovementManager, field: Field, tireTracksManager: ITireTracksManager) {
        super(elements, movementManager, field);
        this._tireTracksManager = tireTracksManager;
    }
    public handle(mask: number): void {
        this._tireTracksManager.reduceOpacity();

        for (const tankElement of this._elements) {
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
                    this._movementManager.removeSpriteAccelerationEffect(tankElement);
                    this._movementManager.backwardMovement(tankElement);
                }
            }
            else {
                this._movementManager.removeSpriteAccelerationEffect(tankElement);
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
    public add(elements: TankElement[]) {
        super.add(elements);
        for (const element of elements) {
            const entity = element.model.entity;
            element.sprite.spawnTireTracks(this._field.canvas, entity.points[0], entity.angle,
                this._tireTracksManager.vanishingListOfTirePairs);
        }
    }
}