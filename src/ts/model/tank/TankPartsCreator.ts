import {IHull, HullModel0} from "./tank parts/IHull";
import {ITrack, TrackModel0} from "./tank parts/ITrack";
import {ITurret, TurretModel0} from "./tank parts/ITurret";
import {IWeapon, WeaponModel0} from "./tank parts/IWeapon";
import {TankParts} from "./TankParts";

export class TankPartsCreator {
    private constructor() { }
    public static create(hullNum: number, trackNum: number, turretNum: number, weaponNum: number): TankParts {
        const turret = TankPartsCreator.createTurret(turretNum);
        const weapon = TankPartsCreator.createWeapon(weaponNum);
        const hull = TankPartsCreator.createHull(hullNum);
        const track = TankPartsCreator.createTrack(trackNum);
        return new TankParts(hull, track, turret, weapon);
    }
    private static createHull(hullNum: number): IHull {
        switch (hullNum) {
            case 0:
                return new HullModel0();
            default:
                throw new Error(`Hull model ${hullNum} was not found`);
        }
    }
    private static createTrack(trackNum: number): ITrack {
        switch (trackNum) {
            case 0:
                return new TrackModel0();
            default:
                throw new Error(`Track model ${trackNum} was not found`);
        }
    }
    private static createTurret(turretNum: number): ITurret {
        switch (turretNum) {
            case 0:
                return new TurretModel0();
            default:
                throw new Error(`Turret model ${turretNum} was not found`);
        }
    }
    private static createWeapon(weaponNum: number): IWeapon {
        switch (weaponNum) {
            case 0:
                return new WeaponModel0();
            default:
                throw new Error(`Weapon model ${weaponNum} was not found`);
        }
    }
}