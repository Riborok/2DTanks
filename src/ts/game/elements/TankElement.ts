import {TankModel} from "../../model/tank/TankModel";
import {TankSprite} from "../../sprite/tank/TankSprite";
import {TankPartsCreator} from "../../model/tank/TankPartsCreator";
import {IEntityStorage} from "../../model/entitiy/IEntityCollisionSystem";
import {TankSpritePartsCreator} from "../../sprite/tank/TankSpritePartsCreator";
import {
    BottomSpriteAccelerationEffect,
    TopSpriteAccelerationEffect
} from "../../sprite/tank/tank parts/SpriteAccelerationEffect";
import {RectangularEntity} from "../../model/entitiy/IEntity";
import {HULL_HEIGHT, HULL_WIDTH, TRACK_INDENT} from "../../constants/gameConstants";
import {IDTracker} from "../id/IDTracker";
import {IIdentifiable} from "../id/IIdentifiable";

export class TankElement implements IIdentifiable {
    private _forwardMask: number;
    private _backwardMask: number;
    private _hullClockwiseMask: number;
    private _hullCounterClockwiseMask: number;
    private _turretClockwiseMask: number;
    private _turretCounterClockwiseMask: number;
    public get forwardMask(): number { return this._forwardMask }
    public set forwardMask(mask: number) { this._forwardMask = mask }
    public get backwardMask(): number { return this._backwardMask }
    public set backwardMask(mask: number) { this._backwardMask = mask }
    public get hullClockwiseMask(): number { return this._hullClockwiseMask }
    public set hullClockwiseMask(mask: number) { this._hullClockwiseMask = mask }
    public get hullCounterClockwiseMask(): number { return this._hullCounterClockwiseMask }
    public set hullCounterClockwiseMask(mask: number) { this._hullCounterClockwiseMask = mask }
    public get turretClockwiseMask(): number { return this._turretClockwiseMask }
    public set turretClockwiseMask(mask: number) { this._turretClockwiseMask = mask }
    public get turretCounterClockwiseMask(): number { return this._turretCounterClockwiseMask }
    public set turretCounterClockwiseMask(mask: number) { this._turretCounterClockwiseMask = mask }

    private readonly _model: TankModel;
    private readonly _sprite: TankSprite;
    private readonly _id: number;
    public get model(): TankModel { return this._model }
    public get sprite(): TankSprite { return this._sprite }
    public get id(): number { return this._id }
    public constructor(x0: number, y0: number, angle: number, color: number,
                       hullNum: number, trackNum: number, turretNum: number, weaponNum: number,
                       forwardMask: number, backwardMask: number,
                       hullClockwiseMask: number, hullCounterClockwiseMask: number,
                       turretClockwiseMask: number, turretCounterClockwiseMask: number) {
        this._forwardMask = forwardMask;
        this._backwardMask = backwardMask;
        this._hullClockwiseMask = hullClockwiseMask;
        this._hullCounterClockwiseMask = hullCounterClockwiseMask;
        this._turretClockwiseMask = turretClockwiseMask;
        this._turretCounterClockwiseMask = turretCounterClockwiseMask;

        const tankParts = TankPartsCreator.create(angle, hullNum, trackNum, turretNum, weaponNum);
        const rectangularEntity = new RectangularEntity(x0, y0,
            HULL_WIDTH[hullNum] + TRACK_INDENT, HULL_HEIGHT[hullNum] + (TRACK_INDENT << 1), angle,
            tankParts.turret.mass + tankParts.weapon.mass + tankParts.weapon.mass, IDTracker.tankId);
        this._model = new TankModel(tankParts, rectangularEntity);

        this._sprite = new TankSprite(TankSpritePartsCreator.create(color, hullNum, trackNum, turretNum, weaponNum,
            this._model.tankParts.track.movementParameters));
        this._id = rectangularEntity.id;
    }
    public spawn(canvas: Element, entityStorage: IEntityStorage) {
        const tankSpriteParts = this._sprite.tankSpriteParts;
        const hullSprite = tankSpriteParts.hullSprite;
        canvas.appendChild(tankSpriteParts.topTrackSprite.sprite);
        canvas.appendChild(tankSpriteParts.bottomTrackSprite.sprite);
        canvas.appendChild(hullSprite.sprite);
        canvas.appendChild(tankSpriteParts.weaponSprite.sprite);
        canvas.appendChild(tankSpriteParts.turretSprite.sprite);


        tankSpriteParts.topSpriteAccelerationEffect = new TopSpriteAccelerationEffect(canvas,
            hullSprite.accelerationEffectIndentX, hullSprite.height);
        tankSpriteParts.bottomSpriteAccelerationEffect = new BottomSpriteAccelerationEffect(canvas,
            hullSprite.accelerationEffectIndentX, hullSprite.height);

        const entity = this._model.entity;

        entityStorage.insert(entity);
        this._sprite.updateAfterAction(entity.points[0], entity.directionAngle, this._model.tankParts.turret.angle);
    }
}