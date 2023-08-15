export interface IWeapon {
    get reloadSpeed(): number;

    get damageCoeff(): number;
    get armorPenetrationCoeff(): number;
    get movementSpeedCoeff(): number;

    get barrelLength(): number;
}

class WeaponModel0 implements IWeapon{
    get armorPenetrationCoeff(): number {return 1};
    get barrelLength(): number {return 47};
    get damageCoeff(): number {return 1};
    get movementSpeedCoeff(): number {return 1};
    get reloadSpeed(): number {return 3000};
}