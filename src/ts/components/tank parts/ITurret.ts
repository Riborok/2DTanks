import {ResolutionManager} from "../../constants/gameConstants";
import {IComponent} from "../IComponent";

export interface ITurret extends IComponent{
    bulletCapacity: number;
    mass: number;
    angleSpeed: number;
}

export function getTurretWidth(turret: ITurret): number {
    return ResolutionManager.TURRET_WIDTH[turret.num];
}

export class TurretModel0 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0006;
    private static readonly MASS: number = 0.35;
    private static readonly BULLET_CAPACITY: number = 3;
    private static readonly NUM: number = 0;

    public angleSpeed: number = TurretModel0.ANGLE_SPEED;
    public mass: number = TurretModel0.MASS;
    public bulletCapacity: number = TurretModel0.BULLET_CAPACITY;
    public get num(): number { return TurretModel0.NUM }
}

export class TurretModel1 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.001;
    private static readonly MASS: number = 0.25;
    private static readonly BULLET_CAPACITY: number = 2;
    private static readonly NUM: number = 1;

    public angleSpeed: number = TurretModel1.ANGLE_SPEED;
    public mass: number = TurretModel1.MASS;
    public bulletCapacity: number = TurretModel1.BULLET_CAPACITY;
    public get num(): number { return TurretModel1.NUM }
}

export class TurretModel2 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0004;
    private static readonly MASS: number = 0.4;
    private static readonly BULLET_CAPACITY: number = 5;
    private static readonly NUM: number = 2;

    public angleSpeed: number = TurretModel2.ANGLE_SPEED;
    public mass: number = TurretModel2.MASS;
    public bulletCapacity: number = TurretModel2.BULLET_CAPACITY;
    public get num(): number { return TurretModel2.NUM }
}

export class TurretModel3 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0008;
    private static readonly MASS: number = 0.4;
    private static readonly BULLET_CAPACITY: number = 3;
    private static readonly NUM: number = 3;

    public angleSpeed: number = TurretModel3.ANGLE_SPEED;
    public mass: number = TurretModel3.MASS;
    public bulletCapacity: number = TurretModel3.BULLET_CAPACITY;
    public get num(): number { return TurretModel3.NUM }
}

export class TurretModel4 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0005;
    private static readonly MASS: number = 0.37;
    private static readonly BULLET_CAPACITY: number = 4;
    private static readonly NUM: number = 4;

    public angleSpeed: number = TurretModel4.ANGLE_SPEED;
    public mass: number = TurretModel4.MASS;
    public bulletCapacity: number = TurretModel4.BULLET_CAPACITY;
    public get num(): number { return TurretModel4.NUM }
}

export class TurretModel5 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0003;
    private static readonly MASS: number = 0.5;
    private static readonly BULLET_CAPACITY: number = 6;
    private static readonly NUM: number = 5;

    public angleSpeed: number = TurretModel5.ANGLE_SPEED;
    public mass: number = TurretModel5.MASS;
    public bulletCapacity: number = TurretModel5.BULLET_CAPACITY;
    public get num(): number { return TurretModel5.NUM }
}

export class TurretModel6 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.00045;
    private static readonly MASS: number = 0.42;
    private static readonly BULLET_CAPACITY: number = 5;
    private static readonly NUM: number = 6;

    public angleSpeed: number = TurretModel6.ANGLE_SPEED;
    public mass: number = TurretModel6.MASS;
    public bulletCapacity: number = TurretModel6.BULLET_CAPACITY;
    public get num(): number { return TurretModel6.NUM }
}

export class TurretModel7 implements ITurret{
    private static readonly ANGLE_SPEED: number = 0.0008;
    private static readonly MASS: number = 0.45;
    private static readonly BULLET_CAPACITY: number = 4;
    private static readonly NUM: number = 7;

    public angleSpeed: number = TurretModel7.ANGLE_SPEED;
    public mass: number = TurretModel7.MASS;
    public bulletCapacity: number = TurretModel7.BULLET_CAPACITY;
    public get num(): number { return TurretModel7.NUM }
}
