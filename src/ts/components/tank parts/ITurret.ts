import {ResolutionManager} from "../../constants/gameConstants";
import {IComponent} from "../IComponent";

export interface ITurret extends IComponent{
    get bulletCapacity(): number;
    get mass(): number;
    get angleSpeed(): number;
}

export function getTurretWidth(turret: ITurret): number {
    return ResolutionManager.TURRET_WIDTH[turret.num];
}

export class TurretModel0 implements ITurret{
    public get angleSpeed(): number { return 0.0006 }
    public get mass(): number { return 0.35 }
    public get bulletCapacity(): number { return 10 }
    public get num(): number { return 0 }
}