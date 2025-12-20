import {IHull} from "./IHull";
import {ITrack} from "./ITrack";
import {ITurret} from "./ITurret";
import {IWeapon} from "./IWeapon";

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