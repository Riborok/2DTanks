import {WEAPON_HEIGHT} from "../../constants/gameConstants";
import {IComponent} from "../IComponent";

export interface IWeapon extends IComponent{
    get reloadSpeed(): number;

    get damageCoeff(): number;
    get armorPenetrationCoeff(): number;
    get forceCoeff(): number;
    get finishSpeedCoeff(): number;

    get mass(): number;
}

export function getBarrelLength(weapon: IWeapon): number {
    return WEAPON_HEIGHT[weapon.num];
}

export class WeaponModel0 implements IWeapon {
    public get armorPenetrationCoeff(): number { return 1 }
    public get damageCoeff(): number { return 1 }
    public get forceCoeff(): number { return 1 }
    public get finishSpeedCoeff(): number { return 1 }
    public get reloadSpeed(): number { return 3000 }
    public get mass(): number { return 0.15 }
    public get num(): number { return 0 }
}