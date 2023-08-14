export interface IWeapon {
    get reloadSpeed(): number;

    get damageCoeff(): number;
    get armorPenetrationCoeff(): number;
    get movementSpeedCoeff(): number;

    get barrelLength(): number;
}