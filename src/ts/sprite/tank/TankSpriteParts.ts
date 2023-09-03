import {HullSprite} from "./tank parts/HullSprite";
import {BottomTrackSprite, TopTrackSprite} from "./tank parts/TrackSprite";
import {TurretSprite} from "./tank parts/TurretSprite";
import {WeaponSprite} from "./tank parts/WeaponSprite";
import {
    BottomSpriteAccelerationEffect,
    SpriteAccelerationEffect,
    TopSpriteAccelerationEffect
} from "../effects/SpriteAccelerationEffect";

export class TankSpriteParts {
    private readonly _hullSprite: HullSprite;
    private readonly _bottomTrackSprite: BottomTrackSprite;
    private readonly _topTrackSprite: TopTrackSprite;
    private readonly _turretSprite: TurretSprite;
    private readonly _weaponSprite: WeaponSprite;

    private _topSpriteAccelerationEffect: TopSpriteAccelerationEffect;
    private _bottomSpriteAccelerationEffect: BottomSpriteAccelerationEffect;
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

    public get topSpriteAccelerationEffect(): SpriteAccelerationEffect { return this._topSpriteAccelerationEffect }
    public set topSpriteAccelerationEffect(value: SpriteAccelerationEffect) { this._topSpriteAccelerationEffect = value }
    public get bottomSpriteAccelerationEffect(): SpriteAccelerationEffect { return this._bottomSpriteAccelerationEffect }
    public set bottomSpriteAccelerationEffect(value: SpriteAccelerationEffect) { this._bottomSpriteAccelerationEffect = value }
}