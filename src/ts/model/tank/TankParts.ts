import {IHull} from "./tank parts/IHull";
import {ITrack} from "./tank parts/ITrack";
import {ITurret} from "./tank parts/ITurret";
import {IWeapon} from "./tank parts/IWeapon";

export class TankParts {
    private readonly _hull: IHull;
    private readonly _track: ITrack;
    private readonly _turret: ITurret;
    private readonly _weapon: IWeapon;
    public constructor(hull: IHull, track: ITrack, turret: ITurret, weapon: IWeapon) {
        this._hull = hull;
        this._track = track;
        this._turret = turret;
        this._weapon = weapon;
    }
    public get hull(): IHull { return this._hull }
    public get track(): ITrack { return this._track }
    public get turret(): ITurret { return this._turret }
    public get weapon(): IWeapon { return this._weapon }
}