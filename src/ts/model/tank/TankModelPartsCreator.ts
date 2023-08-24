import {HullEntity, HullModel0} from "./HullEntity";
import {ITrack, TrackModel0} from "./ITrack";
import {Turret, TurretModel0} from "./Turret";
import {IWeapon, WeaponModel0} from "./IWeapon";
import {TankModelParts} from "./TankModelParts";

export class TankModelPartsCreator {
    private constructor() { }
    public static create(x0: number, y0: number, angle: number,
                         hullNum: number, trackNum: number, turretNum: number, weaponNum: number): TankModelParts {
        const hull = TankModelPartsCreator.createHull(hullNum, x0, y0, angle);
        const turret = TankModelPartsCreator.createTurret(turretNum, angle);
        return new TankModelParts(
            hull,
            TankModelPartsCreator.createTrack(trackNum, hull.weight + turret.weight),
            turret,
            TankModelPartsCreator.createWeapon(weaponNum)
        )
    }
    private static createHull(hullNum: number, x0: number, y0: number, angle: number): HullEntity {
        switch (hullNum) {
            case 0:
                return new HullModel0(x0, y0, angle);
            default:
                throw new Error(`Hull model ${hullNum} was not found`);
        }
    }
    private static createTrack(trackNum: number, weight: number): ITrack {
        switch (trackNum) {
            case 0:
                return new TrackModel0(weight);
            default:
                throw new Error(`Track model ${trackNum} was not found`);
        }
    }
    private static createTurret(turretNum: number, angle: number): Turret {
        switch (turretNum) {
            case 0:
                return new TurretModel0(angle);
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