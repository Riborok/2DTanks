import {HandlingManager, IAddModel} from "./HandlingManager";
import {TankElement} from "../../elements/TankElement";
import {TankMovementManager} from "../movement managers/TankMovementManager";
import {ITireTracksManager, TireTracksManager} from "../TireTracksManager";
import {BulletModel} from "../../../model/bullet/BulletModel";
import {IAnimationManager} from "../AnimationManager";
import {TankShootAnimation} from "../../../sprite/animation/TankShootAnimation";
import {Point} from "../../../geometry/Point";
import {calcMidBetweenTwoPoint} from "../../../geometry/additionalFunc";
import {IKeyHandler} from "../../IKeyHandler";
import {ModelIDTracker} from "../../id/ModelIDTracker";
import {BULLET_ANIMATION_SIZE_INCREASE_COEFF, ResolutionManager} from "../../../constants/gameConstants";
import {IStorage} from "../../../additionally/type";
import {ISprite} from "../../../sprite/Sprite";

export class TankHandlingManager extends HandlingManager<TankElement, TankMovementManager> {
    private readonly _tireTracksManager: ITireTracksManager;
    private readonly _addBulletElement: IAddModel<BulletModel>;
    private readonly _animationManager: IAnimationManager;
    private readonly _KeyHandler: IKeyHandler;
    public constructor(bulletManager: TankMovementManager, storage: IStorage<ISprite>, elements: Map<number, TankElement>,
                       addBulletElement: IAddModel<BulletModel>, animationManager: IAnimationManager, keyHandler: IKeyHandler) {
        super(bulletManager, storage, elements, ModelIDTracker.isTank);
        this._addBulletElement = addBulletElement;
        this._animationManager = animationManager;
        this._KeyHandler = keyHandler;
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
                    this.playShootAnimation(
                        calcMidBetweenTwoPoint(bulletModel.entity.points[0], bulletModel.entity.points[3]),
                        bulletModel.entity.angle,
                        ResolutionManager.BULLET_WIDTH[num] * BULLET_ANIMATION_SIZE_INCREASE_COEFF,
                        ResolutionManager.BULLET_HEIGHT[num] * BULLET_ANIMATION_SIZE_INCREASE_COEFF,
                        num
                    );
                    this._addBulletElement.addBulletModel(bulletModel, num);
                }
            }
        }
    }
    private playShootAnimation(point: Point, angle: number, width: number, height: number, num: number){
        const shootAnimation = new TankShootAnimation(point, angle, width, height, num);
        this._animationManager.add(shootAnimation);
    }
    public add(elements: Iterable<TankElement>) {
        super.add(elements);
        for (const element of elements) {
            const sprite = element.sprite;

            const entity = element.model.entity;
            sprite.spawnTireTracks(this._storage, entity.points[0], entity.angle,
                this._tireTracksManager.vanishingListOfTirePairs);

            sprite.spawnDriftSmoke(this._animationManager);

            const hullSprite = sprite.tankSpriteParts.hullSprite;
            sprite.spawnTankAcceleration(this._storage, hullSprite.accelerationEffectIndentX, hullSprite.height);
        }
    }
}