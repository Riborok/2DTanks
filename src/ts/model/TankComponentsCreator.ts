import {Hull, HullModel0} from "./tank parts/Hull";
import {ITrack, TrackModel0} from "./tank parts/ITrack";
import {Turret, TurretModel0} from "./tank parts/Turret";
import {IWeapon, WeaponModel0} from "./tank parts/IWeapon";
import {TankComponents} from "./TankComponents";
import {TankEntity} from "./entities/TankEntity";

export class TankComponentsCreator {
    private constructor() { }
    public static create(x0: number, y0: number, angle: number,
                         hullNum: number, trackNum: number, turretNum: number, weaponNum: number): TankComponents {
        const turret = TankComponentsCreator.createTurret(turretNum, angle);
        const weapon = TankComponentsCreator.createWeapon(weaponNum);
        const hull = TankComponentsCreator.createHull(hullNum);
        const mass = hull.mass + weapon.mass + turret.mass;
        const track = TankComponentsCreator.createTrack(trackNum, mass);
        const tankEntity = new TankEntity(x0, y0, hullNum, angle, mass);
        return new TankComponents(hull, track, turret, weapon, tankEntity);
    }
    private static createHull(hullNum: number): Hull {
        switch (hullNum) {
            case 0:
                return new HullModel0();
            default:
                throw new Error(`Hull model ${hullNum} was not found`);
        }
    }
    private static createTrack(trackNum: number, mass: number): ITrack {
        switch (trackNum) {
            case 0:
                return new TrackModel0(mass);
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