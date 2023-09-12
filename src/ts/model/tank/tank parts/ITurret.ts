import {TURRET_WIDTH} from "../../../constants/gameConstants";

export interface ITurret {
    get bulletCapacity(): number;
    get mass(): number;
    get width(): number;
    get angleSpeed(): number;
}

export class TurretModel0 implements ITurret{
    public get angleSpeed(): number { return 0.0125 }
    public get mass(): number { return 0.35 }
    public get width(): number { return TURRET_WIDTH[0] }
    public get bulletCapacity(): number { return 10 }
}