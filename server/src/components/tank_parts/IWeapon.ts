import {ResolutionManager} from "../../constants/gameConstants";
import {IComponent} from "../IComponent";

export interface IWeapon extends IComponent{
    reloadSpeed: number;
    damageCoeff: number;
    armorPenetrationCoeff: number;
    startingSpeedCoeff: number;
    mass: number;
}

export function getBarrelLength(weapon: IWeapon): number {
    return ResolutionManager.WEAPON_WIDTH[weapon.num];
}

/** Орудия: перезарядка (мс), урон/пробитие/начальная скорость снаряда — взаимно скомпенсированы по индексам. */
export class WeaponModel0 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 1;
    private static readonly DAMAGE_COEFF: number = 1;
    private static readonly STARTING_SPEED_COEFF: number = 1;
    private static readonly RELOAD_SPEED: number = 950;
    private static readonly MASS: number = 0.15;
    private static readonly NUM: number = 0;
    public armorPenetrationCoeff: number = WeaponModel0.ARMOR_PENETRATION_COEFF;
    public damageCoeff: number = WeaponModel0.DAMAGE_COEFF;
    public startingSpeedCoeff: number = WeaponModel0.STARTING_SPEED_COEFF;
    public reloadSpeed: number = WeaponModel0.RELOAD_SPEED;
    public mass: number = WeaponModel0.MASS;
    public get num(): number { return WeaponModel0.NUM }
}

export class WeaponModel1 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 0.9;
    private static readonly DAMAGE_COEFF: number = 0.9;
    private static readonly STARTING_SPEED_COEFF: number = 1.12;
    private static readonly RELOAD_SPEED: number = 820;
    private static readonly MASS: number = 0.13;
    private static readonly NUM: number = 1;
    public armorPenetrationCoeff: number = WeaponModel1.ARMOR_PENETRATION_COEFF;
    public damageCoeff: number = WeaponModel1.DAMAGE_COEFF;
    public startingSpeedCoeff: number = WeaponModel1.STARTING_SPEED_COEFF;
    public reloadSpeed: number = WeaponModel1.RELOAD_SPEED;
    public mass: number = WeaponModel1.MASS;
    public get num(): number { return WeaponModel1.NUM }
}

export class WeaponModel2 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 1.12;
    private static readonly DAMAGE_COEFF: number = 1.08;
    private static readonly STARTING_SPEED_COEFF: number = 0.88;
    private static readonly RELOAD_SPEED: number = 1180;
    private static readonly MASS: number = 0.19;
    private static readonly NUM: number = 2;
    public armorPenetrationCoeff: number = WeaponModel2.ARMOR_PENETRATION_COEFF;
    public damageCoeff: number = WeaponModel2.DAMAGE_COEFF;
    public startingSpeedCoeff: number = WeaponModel2.STARTING_SPEED_COEFF;
    public reloadSpeed: number = WeaponModel2.RELOAD_SPEED;
    public mass: number = WeaponModel2.MASS;
    public get num(): number { return WeaponModel2.NUM }
}

export class WeaponModel3 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 0.94;
    private static readonly DAMAGE_COEFF: number = 1.12;
    private static readonly STARTING_SPEED_COEFF: number = 1;
    private static readonly RELOAD_SPEED: number = 1040;
    private static readonly MASS: number = 0.14;
    private static readonly NUM: number = 3;
    public armorPenetrationCoeff: number = WeaponModel3.ARMOR_PENETRATION_COEFF;
    public damageCoeff: number = WeaponModel3.DAMAGE_COEFF;
    public startingSpeedCoeff: number = WeaponModel3.STARTING_SPEED_COEFF;
    public reloadSpeed: number = WeaponModel3.RELOAD_SPEED;
    public mass: number = WeaponModel3.MASS;
    public get num(): number { return WeaponModel3.NUM }
}

export class WeaponModel4 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 1.06;
    private static readonly DAMAGE_COEFF: number = 0.96;
    private static readonly STARTING_SPEED_COEFF: number = 1.04;
    private static readonly RELOAD_SPEED: number = 1020;
    private static readonly MASS: number = 0.15;
    private static readonly NUM: number = 4;
    public armorPenetrationCoeff: number = WeaponModel4.ARMOR_PENETRATION_COEFF;
    public damageCoeff: number = WeaponModel4.DAMAGE_COEFF;
    public startingSpeedCoeff: number = WeaponModel4.STARTING_SPEED_COEFF;
    public reloadSpeed: number = WeaponModel4.RELOAD_SPEED;
    public mass: number = WeaponModel4.MASS;
    public get num(): number { return WeaponModel4.NUM }
}

export class WeaponModel5 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 0.8;
    private static readonly DAMAGE_COEFF: number = 0.8;
    private static readonly STARTING_SPEED_COEFF: number = 1;
    private static readonly RELOAD_SPEED: number = 700;
    private static readonly MASS: number = 0.17;
    private static readonly NUM: number = 5;
    public armorPenetrationCoeff: number = WeaponModel5.ARMOR_PENETRATION_COEFF;
    public damageCoeff: number = WeaponModel5.DAMAGE_COEFF;
    public startingSpeedCoeff: number = WeaponModel5.STARTING_SPEED_COEFF;
    public reloadSpeed: number = WeaponModel5.RELOAD_SPEED;
    public mass: number = WeaponModel5.MASS;
    public get num(): number { return WeaponModel5.NUM }
}

export class WeaponModel6 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 0.7;
    private static readonly DAMAGE_COEFF: number = 1.32;
    private static readonly STARTING_SPEED_COEFF: number = 1.08;
    private static readonly RELOAD_SPEED: number = 1320;
    private static readonly MASS: number = 0.24;
    private static readonly NUM: number = 6;
    public armorPenetrationCoeff: number = WeaponModel6.ARMOR_PENETRATION_COEFF;
    public damageCoeff: number = WeaponModel6.DAMAGE_COEFF;
    public startingSpeedCoeff: number = WeaponModel6.STARTING_SPEED_COEFF;
    public reloadSpeed: number = WeaponModel6.RELOAD_SPEED;
    public mass: number = WeaponModel6.MASS;
    public get num(): number { return WeaponModel6.NUM }
}

export class WeaponModel7 implements IWeapon {
    private static readonly ARMOR_PENETRATION_COEFF: number = 0.78;
    private static readonly DAMAGE_COEFF: number = 1.18;
    private static readonly STARTING_SPEED_COEFF: number = 1.1;
    private static readonly RELOAD_SPEED: number = 1180;
    private static readonly MASS: number = 0.21;
    private static readonly NUM: number = 7;
    public armorPenetrationCoeff: number = WeaponModel7.ARMOR_PENETRATION_COEFF;
    public damageCoeff: number = WeaponModel7.DAMAGE_COEFF;
    public startingSpeedCoeff: number = WeaponModel7.STARTING_SPEED_COEFF;
    public reloadSpeed: number = WeaponModel7.RELOAD_SPEED;
    public mass: number = WeaponModel7.MASS;
    public get num(): number { return WeaponModel7.NUM }
}

