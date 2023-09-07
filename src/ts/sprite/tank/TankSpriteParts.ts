import {HullSprite} from "./tank parts/HullSprite";
import {BottomTrackSprite, TopTrackSprite} from "./tank parts/TrackSprite";
import {TurretSprite} from "./tank parts/TurretSprite";
import {WeaponSprite} from "./tank parts/WeaponSprite";

export class TankSpriteParts {
    private readonly _hullSprite: HullSprite;
    private readonly _bottomTrackSprite: BottomTrackSprite;
    private readonly _topTrackSprite: TopTrackSprite;
    private readonly _turretSprite: TurretSprite;
    private readonly _weaponSprite: WeaponSprite;
    public constructor(hullSprite: HullSprite, bottomTrackSprite: BottomTrackSprite, topTrackSprite: TopTrackSprite,
                       turretSprite: TurretSprite, weaponSprite: WeaponSprite) {
        this._hullSprite =  hullSprite;
        this._bottomTrackSprite = bottomTrackSprite;
        this._topTrackSprite = topTrackSprite;
        this._turretSprite = turretSprite;
        this._weaponSprite = weaponSprite;
    }
    public get hullSprite(): HullSprite { return this._hullSprite; }
    public get bottomTrackSprite(): BottomTrackSprite { return this._bottomTrackSprite; }
    public get topTrackSprite(): TopTrackSprite { return this._topTrackSprite; }
    public get turretSprite(): TurretSprite { return this._turretSprite; }
    public get weaponSprite(): WeaponSprite { return this._weaponSprite; }
}