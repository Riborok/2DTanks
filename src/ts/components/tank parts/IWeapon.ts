import {WEAPON_WIDTH} from "../../constants/gameConstants";
import {IComponent} from "../IComponent";

export interface IWeapon extends IComponent{
    get reloadSpeed(): number;

    get damageCoeff(): number;
    get armorPenetrationCoeff(): number;
    get startingSpeedCoeff(): number;

    get mass(): number;
}

export function getBarrelLength(weapon: IWeapon): number {
    return WEAPON_WIDTH[weapon.num];
}

export class WeaponModel0 implements IWeapon {
    public get armorPenetrationCoeff(): number { return 1 }
    public get damageCoeff(): number { return 1 }
    public get startingSpeedCoeff(): number { return 1 }
    public get reloadSpeed(): number { return 1000 }
    public get mass(): number { return 0.15 }
    public get num(): number { return 0 }
}