import {HullEntity, HullModel0} from "./HullEntity";
import {ITrack, TrackModel0} from "./ITrack";
import {ITurret, TurretModel0} from "./ITurret";
import {IWeapon, WeaponModel0} from "./IWeapon";

export class TankCreator {
    private constructor() { }
    public static createHull(hullNum: number, x0: number, y0: number, angle: number): HullEntity {
        switch (hullNum) {
            case 0:
                return new HullModel0(x0, y0, angle);
            default:
                throw new Error(`Hull model ${hullNum} was not found`);
        }
    }
    public static createTrack(trackNum: number): ITrack {
        switch (trackNum) {
            case 0:
                return new TrackModel0();
            default:
                throw new Error(`Track model ${trackNum} was not found`);
        }
    }
    public static createTurret(turretNum: number): ITurret {
        switch (turretNum) {
            case 0:
                return new TurretModel0();
            default:
                throw new Error(`Turret model ${turretNum} was not found`);
        }
    }
    public static createWeapon(weaponNum: number): IWeapon {
        switch (weaponNum) {
            case 0:
                return new WeaponModel0();
            default:
                throw new Error(`Weapon model ${weaponNum} was not found`);
        }
    }
}