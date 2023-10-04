import {ResolutionManager} from "../../constants/gameConstants";
import {IComponent} from "../IComponent";

export interface IWeapon extends IComponent{
    get reloadSpeed(): number;

    get damageCoeff(): number;
    get armorPenetrationCoeff(): number;
    get startingSpeedCoeff(): number;

    get mass(): number;
}

export function getBarrelLength(weapon: IWeapon): number {
    return ResolutionManager.WEAPON_WIDTH[weapon.num];
}

export class WeaponModel0 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 1;
    private static readonly DAMAGE_COEFF: number = 1;
    private static readonly STARTING_SPEED_COEFF: number = 1;
    private static readonly RELOAD_SPEED: number = 1000;
    private static readonly MASS: number = 0.15;
    public get armorPenetrationCoeff(): number { return WeaponModel0.ARMOR_PENETRATION_COEFF }
    public get damageCoeff(): number { return WeaponModel0.DAMAGE_COEFF }
    public get startingSpeedCoeff(): number { return WeaponModel0.STARTING_SPEED_COEFF }
    public get reloadSpeed(): number { return WeaponModel0.RELOAD_SPEED }
    public get mass(): number { return WeaponModel0.MASS }
    public get num(): number { return 0 }
}

export class WeaponModel1 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 0.95;
    private static readonly DAMAGE_COEFF: number = 0.95;
    private static readonly STARTING_SPEED_COEFF: number = 1.2;
    private static readonly RELOAD_SPEED: number = 900;
    private static readonly MASS: number = 0.13;
    public get armorPenetrationCoeff(): number { return WeaponModel1.ARMOR_PENETRATION_COEFF }
    public get damageCoeff(): number { return WeaponModel1.DAMAGE_COEFF }
    public get startingSpeedCoeff(): number { return WeaponModel1.STARTING_SPEED_COEFF }
    public get reloadSpeed(): number { return WeaponModel1.RELOAD_SPEED }
    public get mass(): number { return WeaponModel1.MASS }
    public get num(): number { return 1 }
}

export class WeaponModel2 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 1.2;
    private static readonly DAMAGE_COEFF: number = 1.1;
    private static readonly STARTING_SPEED_COEFF: number = 0.8;
    private static readonly RELOAD_SPEED: number = 1200;
    private static readonly MASS: number = 0.2;
    public get armorPenetrationCoeff(): number { return WeaponModel2.ARMOR_PENETRATION_COEFF }
    public get damageCoeff(): number { return WeaponModel2.DAMAGE_COEFF }
    public get startingSpeedCoeff(): number { return WeaponModel2.STARTING_SPEED_COEFF }
    public get reloadSpeed(): number { return WeaponModel2.RELOAD_SPEED }
    public get mass(): number { return WeaponModel2.MASS }
    public get num(): number { return 2 }
}

export class WeaponModel3 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 0.9;
    private static readonly DAMAGE_COEFF: number = 1.2;
    private static readonly STARTING_SPEED_COEFF: number = 1;
    private static readonly RELOAD_SPEED: number = 1100;
    private static readonly MASS: number = 0.14;
    public get armorPenetrationCoeff(): number { return WeaponModel3.ARMOR_PENETRATION_COEFF }
    public get damageCoeff(): number { return WeaponModel3.DAMAGE_COEFF }
    public get startingSpeedCoeff(): number { return WeaponModel3.STARTING_SPEED_COEFF }
    public get reloadSpeed(): number { return WeaponModel3.RELOAD_SPEED }
    public get mass(): number { return WeaponModel3.MASS }
    public get num(): number { return 3 }
}

export class WeaponModel4 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 1.1;
    private static readonly DAMAGE_COEFF: number = 0.9;
    private static readonly STARTING_SPEED_COEFF: number = 1;
    private static readonly RELOAD_SPEED: number = 1000;
    private static readonly MASS: number = 0.15;
    public get armorPenetrationCoeff(): number { return WeaponModel4.ARMOR_PENETRATION_COEFF }
    public get damageCoeff(): number { return WeaponModel4.DAMAGE_COEFF }
    public get startingSpeedCoeff(): number { return WeaponModel4.STARTING_SPEED_COEFF }
    public get reloadSpeed(): number { return WeaponModel4.RELOAD_SPEED }
    public get mass(): number { return WeaponModel4.MASS }
    public get num(): number { return 4 }
}

export class WeaponModel5 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 0.7;
    private static readonly DAMAGE_COEFF: number = 0.7;
    private static readonly STARTING_SPEED_COEFF: number = 1;
    private static readonly RELOAD_SPEED: number = 500;
    private static readonly MASS: number = 0.18;
    public get armorPenetrationCoeff(): number { return WeaponModel5.ARMOR_PENETRATION_COEFF }
    public get damageCoeff(): number { return WeaponModel5.DAMAGE_COEFF }
    public get startingSpeedCoeff(): number { return WeaponModel5.STARTING_SPEED_COEFF }
    public get reloadSpeed(): number { return WeaponModel5.RELOAD_SPEED }
    public get mass(): number { return WeaponModel5.MASS }
    public get num(): number { return 5 }
}

export class WeaponModel6 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 0.6;
    private static readonly DAMAGE_COEFF: number = 1.4;
    private static readonly STARTING_SPEED_COEFF: number = 1.2;
    private static readonly RELOAD_SPEED: number = 1500;
    private static readonly MASS: number = 0.25;
    public get armorPenetrationCoeff(): number { return WeaponModel6.ARMOR_PENETRATION_COEFF }
    public get damageCoeff(): number { return WeaponModel6.DAMAGE_COEFF }
    public get startingSpeedCoeff(): number { return WeaponModel6.STARTING_SPEED_COEFF }
    public get reloadSpeed(): number { return WeaponModel6.RELOAD_SPEED }
    public get mass(): number { return WeaponModel6.MASS }
    public get num(): number { return 6 }
}

export class WeaponModel7 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 0.75;
    private static readonly DAMAGE_COEFF: number = 1.3;
    private static readonly STARTING_SPEED_COEFF: number = 1.1;
    private static readonly RELOAD_SPEED: number = 1300;
    private static readonly MASS: number = 0.22;
    public get armorPenetrationCoeff(): number { return WeaponModel7.ARMOR_PENETRATION_COEFF }
    public get damageCoeff(): number { return WeaponModel7.DAMAGE_COEFF }
    public get startingSpeedCoeff(): number { return WeaponModel7.STARTING_SPEED_COEFF }
    public get reloadSpeed(): number { return WeaponModel7.RELOAD_SPEED }
    public get mass(): number { return WeaponModel7.MASS }
    public get num(): number { return 7 }
}