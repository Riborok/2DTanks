import {
    HullModel0, HullModel1, HullModel2, HullModel3,
    HullModel4, HullModel5, HullModel6, HullModel7,
    IHull
} from "./IHull";
import {ITrack, TrackModel0, TrackModel1, TrackModel2, TrackModel3} from "./ITrack";
import {
    ITurret,
    TurretModel0, TurretModel1, TurretModel2, TurretModel3,
    TurretModel4, TurretModel5, TurretModel6, TurretModel7
} from "./ITurret";
import {
    IWeapon,
    WeaponModel0, WeaponModel1, WeaponModel2, WeaponModel3,
    WeaponModel4, WeaponModel5, WeaponModel6, WeaponModel7
} from "./IWeapon";
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
            case 0: return new HullModel0();
            case 1: return new HullModel1();
            case 2: return new HullModel2();
            case 3: return new HullModel3();
            case 4: return new HullModel4();
            case 5: return new HullModel5();
            case 6: return new HullModel6();
            case 7: return new HullModel7();
            default: throw new Error(`Hull model ${hullNum} was not found`);
        }
    }
    
    private static createTrack(trackNum: number): ITrack {
        switch (trackNum) {
            case 0: return new TrackModel0();
            case 1: return new TrackModel1();
            case 2: return new TrackModel2();
            case 3: return new TrackModel3();
            default: throw new Error(`Track model ${trackNum} was not found`);
        }
    }
    
    private static createTurret(turretNum: number): ITurret {
        switch (turretNum) {
            case 0: return new TurretModel0();
            case 1: return new TurretModel1();
            case 2: return new TurretModel2();
            case 3: return new TurretModel3();
            case 4: return new TurretModel4();
            case 5: return new TurretModel5();
            case 6: return new TurretModel6();
            case 7: return new TurretModel7();
            default: throw new Error(`Turret model ${turretNum} was not found`);
        }
    }
    
    private static createWeapon(weaponNum: number): IWeapon {
        switch (weaponNum) {
            case 0: return new WeaponModel0();
            case 1: return new WeaponModel1();
            case 2: return new WeaponModel2();
            case 3: return new WeaponModel3();
            case 4: return new WeaponModel4();
            case 5: return new WeaponModel5();
            case 6: return new WeaponModel6();
            case 7: return new WeaponModel7();
            default: throw new Error(`Weapon model ${weaponNum} was not found`);
        }
    }
}


