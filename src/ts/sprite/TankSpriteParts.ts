import {HullSprite} from "./HullSprite";
import {DownTrackSprite, UpTrackSprite} from "./TrackSprite";
import {TurretSprite} from "./TurretSprite";
import {WeaponSprite} from "./WeaponSprite";

export class TankSpriteParts {
    private readonly _hullSprite: HullSprite;
    private readonly _downTrackSprite: DownTrackSprite;
    private readonly _upTrackSprite: UpTrackSprite;
    private readonly _turretSprite: TurretSprite;
    private readonly _weaponSprite: WeaponSprite;

    public constructor(color: number, hullNum: number, trackNum: number, turretNum: number, weaponNum: number) {
        this._hullSprite =  new HullSprite(color, hullNum);
        this._downTrackSprite = new DownTrackSprite(trackNum, HullSprite.WIDTH[hullNum], HullSprite.HEIGHT[hullNum]);
        this._upTrackSprite = new UpTrackSprite(trackNum, HullSprite.WIDTH[hullNum]);
        this._turretSprite = new TurretSprite(color, turretNum,
            HullSprite.TURRET_INDENT_X[hullNum], HullSprite.HEIGHT[hullNum] >> 1);
        this._weaponSprite = new WeaponSprite(weaponNum,
            TurretSprite.WIDTH[turretNum], TurretSprite.HEIGHT[turretNum] >> 1);
    }
    public get hullSprite(): HullSprite { return this._hullSprite; }
    public get downTrackSprite(): DownTrackSprite { return this._downTrackSprite; }
    public get upTrackSprite(): UpTrackSprite { return this._upTrackSprite; }
    public get turretSprite(): TurretSprite { return this._turretSprite; }
    public get weaponSprite(): WeaponSprite { return this._weaponSprite; }
}