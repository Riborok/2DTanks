import {Hull} from "./tank parts/Hull";
import {ITrack} from "./tank parts/ITrack";
import {Turret} from "./tank parts/Turret";
import {IWeapon} from "./tank parts/IWeapon";
import {TankEntity} from "./entities/TankEntity";

export class TankComponents {
    private readonly _hull: Hull;
    private readonly _track: ITrack;
    private readonly _turret: Turret;
    private readonly _weapon: IWeapon;
    private readonly _tankEntity: TankEntity;
    public constructor(hull: Hull, track: ITrack, turret: Turret, weapon: IWeapon, tankEntity: TankEntity) {
        this._hull = hull;
        this._track = track;
        this._turret = turret;
        this._weapon = weapon;
        this._tankEntity = tankEntity;
    }
    public get hull(): Hull { return this._hull }
    public get track(): ITrack { return this._track }
    public get turret(): Turret { return this._turret }
    public get weapon(): IWeapon { return this._weapon }
    public get tankEntity(): TankEntity { return this._tankEntity }
}