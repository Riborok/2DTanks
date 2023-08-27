import {WEAPON_HEIGHT} from "../../constants/gameConstants";

export interface IWeapon {
    get reloadSpeed(): number;

    get damageCoeff(): number;
    get armorPenetrationCoeff(): number;
    get accelerationCoeff(): number;
    get finishSpeedCoeff(): number;

    get barrelLength(): number;
    get mass(): number;
}

export class WeaponModel0 implements IWeapon {
    public get barrelLength(): number { return WEAPON_HEIGHT[0] }
    public get armorPenetrationCoeff(): number { return 1 }
    public get damageCoeff(): number { return 1 }
    public get accelerationCoeff(): number { return 1 }
    public get finishSpeedCoeff(): number { return 1 }
    public get reloadSpeed(): number { return 3000 }
    public get mass(): number { return 0.15 }
}