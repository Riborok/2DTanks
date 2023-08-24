import {TankModel} from "../model/tank/TankModel";
import {TankSprite} from "../sprite/TankSprite";
import {TankModelPartsCreator} from "../model/tank/TankModelPartsCreator";
import {IEntityStorage} from "../model/IEntityStorage";
import {TankSpritePartsCreator} from "../sprite/TankSpritePartsCreator";
import {BottomSpriteAccelerationEffect, TopSpriteAccelerationEffect} from "../sprite/SpriteAccelerationEffect";

export class TankElement {
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
    public get model(): TankModel { return this._model }
    public get sprite(): TankSprite { return this._sprite }
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

        this._sprite = new TankSprite(TankSpritePartsCreator.create(color, hullNum, trackNum, turretNum, weaponNum));

        this._model = new TankModel(TankModelPartsCreator.create(x0, y0, angle, hullNum, trackNum, turretNum, weaponNum));
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
            hullSprite.accelerationEffectIndentX, hullSprite.width);
        tankSpriteParts.bottomSpriteAccelerationEffect = new BottomSpriteAccelerationEffect(canvas,
            hullSprite.accelerationEffectIndentX, hullSprite.width);

        const hullEntity = this._model.tankParts.hullEntity;

        entityStorage.insert(hullEntity);
        this._sprite.updateSprite(hullEntity.points[0], hullEntity.angle, this._model.tankParts.turret.angle);
    }
}