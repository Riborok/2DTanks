import {WEAPON_HEIGHT} from "../../constants/gameConstants";

export interface IWeapon {
    get reloadSpeed(): number;

    get damageCoeff(): number;
    get armorPenetrationCoeff(): number;
    get movementSpeedCoeff(): number;

    get barrelLength(): number;
}

export class WeaponModel0 implements IWeapon {
    public get armorPenetrationCoeff(): number { return 1 }
    public get barrelLength(): number { return WEAPON_HEIGHT[0] }
    public get damageCoeff(): number { return 1 }
    public get movementSpeedCoeff(): number { return 1 }
    public get reloadSpeed(): number { return 3000 }
}