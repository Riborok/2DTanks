import {HullEntity, HullModel0} from "./HullEntity";
import {ITrack, TrackModel0} from "./ITrack";
import {ITurret, TurretModel0} from "./ITurret";
import {IWeapon, WeaponModel0} from "./IWeapon";

export class TankParts {
    private readonly _hullEntity: HullEntity;
    private readonly _track: ITrack;
    private readonly _turret: ITurret;
    private readonly _weapon: IWeapon;
    constructor(hullEntity: HullEntity, track: ITrack, turret: ITurret, weapon: IWeapon) {
        this._hullEntity = hullEntity;
        this._track = track;
        this._turret = turret;
        this._weapon = weapon;
    }
    public get hullEntity(): HullEntity { return this._hullEntity; }
    public get track(): ITrack { return this._track; }
    public get turret(): ITurret { return this._turret; }
    public get weapon(): IWeapon { return this._weapon; }
}