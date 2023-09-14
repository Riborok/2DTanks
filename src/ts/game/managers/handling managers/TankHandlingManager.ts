import {HandlingManagers, IAddModel, ITankHandlingManager} from "./HandlingManagers";
import {TankElement} from "../../elements/TankElement";
import {TankMovementManager} from "../movement managers/TankMovementManager";
import {ITireTracksManager, TireTracksManager} from "../TireTracksManager";
import {Field} from "../../Field";
import {BulletModel} from "../../../model/bullet/BulletModel";
import {IAnimationManager} from "../AnimationManager";

export class TankHandlingManager extends HandlingManagers<TankElement, TankMovementManager> implements ITankHandlingManager {
    private readonly _tireTracksManager: ITireTracksManager = new TireTracksManager();
    private readonly _addBulletElement: IAddModel<BulletModel>;
    private readonly _animationManager: IAnimationManager;
    public constructor(bulletManager: TankMovementManager, field: Field, elements: Map<number, TankElement>,
                       addBulletElement: IAddModel<BulletModel>, animationManager: IAnimationManager) {
        super(bulletManager, field, elements);
        this._addBulletElement = addBulletElement;
        this._animationManager = animationManager;
    }
    public handle(mask: number, deltaTime: number): void {
        this._tireTracksManager.reduceOpacity();

        for (const tankElement of this._elements.values()) {
            const control = tankElement.control;

            let action = (mask & control.turretClockwiseMask) !== 0;
            let oppositeAction = (mask & control.turretCounterClockwiseMask) !== 0;
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.turretClockwiseMovement(tankElement, deltaTime);
                else if (oppositeAction)
                    this._movementManager.turretCounterclockwiseMovement(tankElement, deltaTime);
            }

            action = (mask & control.forwardMask) !== 0;
            oppositeAction = (mask & control.backwardMask) !== 0;
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.forwardMovement(tankElement, deltaTime);
                else if (oppositeAction) {
                    tankElement.sprite.removeAcceleration();
                    this._movementManager.backwardMovement(tankElement, deltaTime);
                }
            }
            else {
                tankElement.sprite.removeAcceleration();
                this._movementManager.residualMovement(tankElement, deltaTime);
            }

            action = (mask & control.hullClockwiseMask) !== 0;
            oppositeAction = (mask & control.hullCounterClockwiseMask) !== 0;
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.hullClockwiseMovement(tankElement, deltaTime);
                else if (oppositeAction)
                    this._movementManager.hullCounterclockwiseMovement(tankElement, deltaTime);
            }
            else
                this._movementManager.residualAngularMovement(tankElement, deltaTime);

            action = (mask & control.shoot) !== 0;
            if (action) {
                const bulletModel: BulletModel | null = tankElement.model.shot();
                if (bulletModel)
                    this._addBulletElement.addBulletModel(bulletModel, tankElement.model.bulletNum);
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

            sprite.spawnDriftSmoke(this._field.canvas, this._animationManager);

            const hullSprite = sprite.tankSpriteParts.hullSprite;
            sprite.spawnTankAcceleration(this._field.canvas, hullSprite.accelerationEffectIndentX, hullSprite.height);
        }
    }
}