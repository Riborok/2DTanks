import {Tank} from "../model/tank/Tank";
import {TankSprite} from "../sprite/TankSprite";
import {TankParts} from "../model/tank/TankParts";
import {TankCreator} from "../model/tank/TankCreator";
import {TankSpriteParts} from "../sprite/TankSpriteParts";

export class TankElement {
    private readonly _model: Tank;
    private readonly _sprite: TankSprite;
    public get model(): Tank { return this._model }
    public get sprite(): TankSprite { return this._sprite }
    public constructor(canvas: Element, x0: number, y0: number, angle: number, color: number,
                       hullNum: number, trackNum: number, turretNum: number, weaponNum: number) {
        const tankSpriteParts = new TankSpriteParts(color, hullNum, trackNum, turretNum, weaponNum);
        canvas.appendChild(tankSpriteParts.upTrackSprite.sprite);
        canvas.appendChild(tankSpriteParts.downTrackSprite.sprite);
        canvas.appendChild(tankSpriteParts.hullSprite.sprite);
        canvas.appendChild(tankSpriteParts.weaponSprite.sprite);
        canvas.appendChild(tankSpriteParts.turretSprite.sprite);

        this._sprite = new TankSprite(tankSpriteParts);

        this._model = new Tank(
            new TankParts(
                TankCreator.createHull(hullNum, x0, y0, angle),
                TankCreator.createTrack(trackNum),
                TankCreator.createTurret(turretNum),
                TankCreator.createWeapon(weaponNum)
            )
        );
    }
}