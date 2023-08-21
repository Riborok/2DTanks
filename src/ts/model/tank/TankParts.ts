import {HullEntity} from "./HullEntity";
import {ITrack} from "./ITrack";
import {Turret} from "./Turret";
import {IWeapon} from "./IWeapon";

export class TankParts {
    private readonly _hullEntity: HullEntity;
    private readonly _track: ITrack;
    private readonly _turret: Turret;
    private readonly _weapon: IWeapon;
    public constructor(hullEntity: HullEntity, track: ITrack, turret: Turret, weapon: IWeapon) {
        this._hullEntity = hullEntity;
        this._track = track;
        this._turret = turret;
        this._weapon = weapon;
    }
    public get hullEntity(): HullEntity { return this._hullEntity; }
    public get track(): ITrack { return this._track; }
    public get turret(): Turret { return this._turret; }
    public get weapon(): IWeapon { return this._weapon; }
}