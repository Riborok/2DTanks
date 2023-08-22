import {HullSprite} from "./HullSprite";
import {BottomTrackSprite, TopTrackSprite} from "./TrackSprite";
import {TurretSprite} from "./TurretSprite";
import {WeaponSprite} from "./WeaponSprite";

export class TankSpriteParts {
    private readonly _hullSprite: HullSprite;
    private readonly _bottomTrackSprite: BottomTrackSprite;
    private readonly _topTrackSprite: TopTrackSprite;
    private readonly _turretSprite: TurretSprite;
    private readonly _weaponSprite: WeaponSprite;

    public constructor(hullSprite: HullSprite, bottomTrackSprite1: BottomTrackSprite, topTrackSprite1: TopTrackSprite,
                       turretSprite: TurretSprite, weaponSprite: WeaponSprite) {
        this._hullSprite =  hullSprite;
        this._bottomTrackSprite = bottomTrackSprite1;
        this._topTrackSprite = topTrackSprite1;
        this._turretSprite = turretSprite;
        this._weaponSprite = weaponSprite;
    }
    public get hullSprite(): HullSprite { return this._hullSprite; }
    public get bottomTrackSprite(): BottomTrackSprite { return this._bottomTrackSprite; }
    public get topTrackSprite(): TopTrackSprite { return this._topTrackSprite; }
    public get turretSprite(): TurretSprite { return this._turretSprite; }
    public get weaponSprite(): WeaponSprite { return this._weaponSprite; }
}