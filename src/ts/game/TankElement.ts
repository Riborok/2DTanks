import {Tank} from "../model/tank/Tank";
import {TankSprite} from "../sprite/TankSprite";
import {TankParts} from "../model/tank/TankParts";
import {TankCreator} from "../model/tank/TankCreator";
import {TankSpriteParts} from "../sprite/TankSpriteParts";
import {IRectangularEntityStorage} from "../model/IRectangularEntityStorage";

export class TankElement {
    private _forwardMask: number;
    private _backwardMask: number;
    private _hullClockwiseMask: number;
    private _hullCounterClockwiseMask: number;
    public get forwardMask(): number { return this._forwardMask }
    public set forwardMask(mask: number) { this._forwardMask = mask }
    public get backwardMask(): number { return this._backwardMask }
    public set backwardMask(mask: number) { this._backwardMask = mask }
    public get hullClockwiseMask(): number { return this._hullClockwiseMask }
    public set hullClockwiseMask(mask: number) { this._hullClockwiseMask = mask }
    public get hullCounterClockwiseMask(): number { return this._hullCounterClockwiseMask }
    public set hullCounterClockwiseMask(mask: number) { this._hullCounterClockwiseMask = mask }

    private readonly _model: Tank;
    private readonly _sprite: TankSprite;
    public get model(): Tank { return this._model }
    public get sprite(): TankSprite { return this._sprite }
    public constructor(x0: number, y0: number, angle: number, color: number,
                       hullNum: number, trackNum: number, turretNum: number, weaponNum: number,
                       forwardMask: number, backwardMask: number,
                       hullClockwiseMask: number, hullCounterClockwiseMask: number) {
        this._forwardMask = forwardMask;
        this._backwardMask = backwardMask;
        this._hullClockwiseMask = hullClockwiseMask;
        this._hullCounterClockwiseMask = hullCounterClockwiseMask;

        this._sprite = new TankSprite(new TankSpriteParts(color, hullNum, trackNum, turretNum, weaponNum));

        this._model = new Tank(
            new TankParts(
                TankCreator.createHull(hullNum, x0, y0, angle),
                TankCreator.createTrack(trackNum),
                TankCreator.createTurret(turretNum),
                TankCreator.createWeapon(weaponNum)
            )
        );
    }
    public spawn(canvas: Element, rectangularEntityStorage: IRectangularEntityStorage) {
        const tankSpriteParts = this._sprite.tankSpriteParts;
        canvas.appendChild(tankSpriteParts.upTrackSprite.sprite);
        canvas.appendChild(tankSpriteParts.downTrackSprite.sprite);
        canvas.appendChild(tankSpriteParts.hullSprite.sprite);
        canvas.appendChild(tankSpriteParts.weaponSprite.sprite);
        canvas.appendChild(tankSpriteParts.turretSprite.sprite);

        const hullEntity = this._model.tankParts.hullEntity;

        rectangularEntityStorage.insert(hullEntity);
        this._sprite.display(hullEntity.points[0], hullEntity.calcCenter(),
            hullEntity.angle, this._model.tankParts.turret.angle);
    }
}