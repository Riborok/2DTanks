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
    private static readonly ANGLE_SPEED: number = 0.0006;
    private static readonly MASS: number = 0.35;
    private static readonly BULLET_CAPACITY: number = 3;
    public get angleSpeed(): number { return TurretModel0.ANGLE_SPEED }
    public get mass(): number { return TurretModel0.MASS }
    public get bulletCapacity(): number { return TurretModel0.BULLET_CAPACITY }
    public get num(): number { return 0 }
}

export class TurretModel1 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.001;
    private static readonly MASS: number = 0.25;
    private static readonly BULLET_CAPACITY: number = 2;
    public get angleSpeed(): number { return TurretModel1.ANGLE_SPEED }
    public get mass(): number { return TurretModel1.MASS }
    public get bulletCapacity(): number { return TurretModel1.BULLET_CAPACITY }
    public get num(): number { return 1 }
}

export class TurretModel2 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0004;
    private static readonly MASS: number = 0.4;
    private static readonly BULLET_CAPACITY: number = 5;
    public get angleSpeed(): number { return TurretModel2.ANGLE_SPEED }
    public get mass(): number { return TurretModel2.MASS }
    public get bulletCapacity(): number { return TurretModel2.BULLET_CAPACITY }
    public get num(): number { return 2 }
}

export class TurretModel3 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0008;
    private static readonly MASS: number = 0.4;
    private static readonly BULLET_CAPACITY: number = 3;
    public get angleSpeed(): number { return TurretModel3.ANGLE_SPEED }
    public get mass(): number { return TurretModel3.MASS }
    public get bulletCapacity(): number { return TurretModel3.BULLET_CAPACITY }
    public get num(): number { return 3 }
}

export class TurretModel4 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0005;
    private static readonly MASS: number = 0.37;
    private static readonly BULLET_CAPACITY: number = 4;
    public get angleSpeed(): number { return TurretModel4.ANGLE_SPEED }
    public get mass(): number { return TurretModel4.MASS }
    public get bulletCapacity(): number { return TurretModel4.BULLET_CAPACITY }
    public get num(): number { return 4 }
}

export class TurretModel5 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0003;
    private static readonly MASS: number = 0.5;
    private static readonly BULLET_CAPACITY: number = 6;
    public get angleSpeed(): number { return TurretModel5.ANGLE_SPEED }
    public get mass(): number { return TurretModel5.MASS }
    public get bulletCapacity(): number { return TurretModel5.BULLET_CAPACITY }
    public get num(): number { return 5 }
}

export class TurretModel6 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.00045;
    private static readonly MASS: number = 0.42;
    private static readonly BULLET_CAPACITY: number = 5;
    public get angleSpeed(): number { return TurretModel6.ANGLE_SPEED }
    public get mass(): number { return TurretModel6.MASS }
    public get bulletCapacity(): number { return TurretModel6.BULLET_CAPACITY }
    public get num(): number { return 6 }
}

export class TurretModel7 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0008;
    private static readonly MASS: number = 0.45;
    private static readonly BULLET_CAPACITY: number = 4;
    public get angleSpeed(): number { return TurretModel7.ANGLE_SPEED }
    public get mass(): number { return TurretModel7.MASS }
    public get bulletCapacity(): number { return TurretModel7.BULLET_CAPACITY }
    public get num(): number { return 7 }
}
