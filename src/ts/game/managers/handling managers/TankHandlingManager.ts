import {HandlingManager, IAddModel} from "./HandlingManager";
import {TankElement} from "../../elements/TankElement";
import {TankMovementManager} from "../movement managers/TankMovementManager";
import {ITireTracksManager, TireTracksManager} from "../TireTracksManager";
import {BulletModel} from "../../../model/bullet/BulletModel";
import {IAnimationManager} from "../animation managers/AnimationManager";
import {IKeyHandler} from "../../input/IKeyHandler";
import {ModelIDTracker} from "../../id/ModelIDTracker";
import {ITankAnimator, TankAnimator} from "../animation managers/Animators";
import {IStorageWithIdRemoval} from "../../processors/ICanvas";
import {IIdentifiable} from "../../id/IIdentifiable";

export class TankHandlingManager extends HandlingManager<TankElement, TankMovementManager> {
    private readonly _tireTracksManager: ITireTracksManager;
    private readonly _addBulletElement: IAddModel<BulletModel>;
    private readonly _tankAnimator: ITankAnimator;
    private readonly _KeyHandler: IKeyHandler;
    public constructor(bulletManager: TankMovementManager, storage: IStorageWithIdRemoval<IIdentifiable>, elements: Map<number, TankElement>,
                       addBulletElement: IAddModel<BulletModel>, animationManager: IAnimationManager, keyHandler: IKeyHandler) {
        super(bulletManager, storage, elements, ModelIDTracker.isTank);
        this._addBulletElement = addBulletElement;
        this._KeyHandler = keyHandler;
        this._tankAnimator = new TankAnimator(animationManager);
        this._tireTracksManager = new TireTracksManager(storage);
    }
    public handle(deltaTime: number): void {
        this._tireTracksManager.reduceOpacity();

        for (const tankElement of this._elements.values()) {
            const control = tankElement.control;

            let action = this._KeyHandler.isKeyDown(control.turretClockwiseKey);
            let oppositeAction = this._KeyHandler.isKeyDown(control.turretCounterClockwiseKey);
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.turretClockwiseMovement(tankElement, deltaTime);
                else if (oppositeAction)
                    this._movementManager.turretCounterclockwiseMovement(tankElement, deltaTime);
            }

            action = this._KeyHandler.isKeyDown(control.forwardKey);
            oppositeAction = this._KeyHandler.isKeyDown(control.backwardKey);
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

            action = this._KeyHandler.isKeyDown(control.hullClockwiseKey);
            oppositeAction = this._KeyHandler.isKeyDown(control.hullCounterClockwiseKey);
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.hullClockwiseMovement(tankElement, deltaTime);
                else if (oppositeAction)
                    this._movementManager.hullCounterclockwiseMovement(tankElement, deltaTime);
            }
            else
                this._movementManager.residualAngularMovement(tankElement, deltaTime);

            action = this._KeyHandler.isKeyDown(control.shootKey);
            if (action) {
                const bulletModel: BulletModel | null = tankElement.model.shot();
                if (bulletModel) {
                    const num = tankElement.model.bulletNum;
                    this._tankAnimator.createShootAnimation(bulletModel, num);
                    this._addBulletElement.addBulletModel(bulletModel, num);
                }
            }
        }
    }
    public add(elements: Iterable<TankElement>) {
        super.add(elements);
        for (const element of elements) {
            const sprite = element.sprite;

            const entity = element.model.entity;
            sprite.spawnTireTracks(this._spriteStorage, entity.points[0], entity.angle,
                this._tireTracksManager.vanishingListOfTirePairs);

            sprite.spawnDriftSmoke(this._tankAnimator.animationManager);

            const hullSprite = sprite.tankSpriteParts.hullSprite;
            sprite.spawnTankAcceleration(this._spriteStorage, hullSprite.accelerationEffectIndentX, hullSprite.height);
        }
    }
}