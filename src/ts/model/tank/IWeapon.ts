import {WEAPON_HEIGHT} from "../../constants";

export interface IWeapon {
    get reloadSpeed(): number;

    get damageCoeff(): number;
    get armorPenetrationCoeff(): number;
    get movementSpeedCoeff(): number;

    get barrelLength(): number;
}

export class WeaponModel0 implements IWeapon {
    get armorPenetrationCoeff(): number { return 1 }
    get barrelLength(): number { return WEAPON_HEIGHT[0] }
    get damageCoeff(): number { return 1 }
    get movementSpeedCoeff(): number { return 1 }
    get reloadSpeed(): number { return 3000 }
}