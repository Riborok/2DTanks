import {IComponent} from "../IComponent";

export interface IHull extends IComponent{
    get health(): number;
    get armor(): number;
    get mass(): number;
    get armorStrength(): number;
}

export class HullModel0 implements IHull {
    private static readonly HEALTH: number = 100;
    private static readonly ARMOR: number = 1;
    private static readonly MASS: number = 1;
    private static readonly ARMOR_STRENGTH: number = 20;
    private static readonly NUM: number = 0;

    public get health(): number { return HullModel0.HEALTH }
    public get armor(): number { return HullModel0.ARMOR }
    public get mass(): number { return HullModel0.MASS }
    public get armorStrength(): number { return HullModel0.ARMOR_STRENGTH }
    public get num(): number { return HullModel0.NUM }
}

export class HullModel1 implements IHull {
    private static readonly HEALTH: number = 90;
    private static readonly ARMOR: number = 1.1;
    private static readonly MASS: number = 1;
    private static readonly ARMOR_STRENGTH: number = 25;
    private static readonly NUM: number = 1;

    public get health(): number { return HullModel1.HEALTH }
    public get armor(): number { return HullModel1.ARMOR }
    public get mass(): number { return HullModel1.MASS }
    public get armorStrength(): number { return HullModel1.ARMOR_STRENGTH }
    public get num(): number { return HullModel1.NUM }
}

export class HullModel2 implements IHull {
    private static readonly HEALTH: number = 150;
    private static readonly ARMOR: number = 1;
    private static readonly MASS: number = 1.5;
    private static readonly ARMOR_STRENGTH: number = 20;
    private static readonly NUM: number = 2;

    public get health(): number { return HullModel2.HEALTH }
    public get armor(): number { return HullModel2.ARMOR }
    public get mass(): number { return HullModel2.MASS }
    public get armorStrength(): number { return HullModel2.ARMOR_STRENGTH }
    public get num(): number { return HullModel2.NUM }
}

export class HullModel3 implements IHull {
    private static readonly HEALTH: number = 100;
    private static readonly ARMOR: number = 1.5;
    private static readonly MASS: number = 1.5;
    private static readonly ARMOR_STRENGTH: number = 30;
    private static readonly NUM: number = 3;

    public get health(): number { return HullModel3.HEALTH }
    public get armor(): number { return HullModel3.ARMOR }
    public get mass(): number { return HullModel3.MASS }
    public get armorStrength(): number { return HullModel3.ARMOR_STRENGTH }
    public get num(): number { return HullModel3.NUM }
}

export class HullModel4 implements IHull {
    private static readonly HEALTH: number = 90;
    private static readonly ARMOR: number = 0.9;
    private static readonly MASS: number = 0.9;
    private static readonly ARMOR_STRENGTH: number = 18;
    private static readonly NUM: number = 4;

    public get health(): number { return HullModel4.HEALTH }
    public get armor(): number { return HullModel4.ARMOR }
    public get mass(): number { return HullModel4.MASS }
    public get armorStrength(): number { return HullModel4.ARMOR_STRENGTH }
    public get num(): number { return HullModel4.NUM }
}

export class HullModel5 implements IHull {
    private static readonly HEALTH: number = 110;
    private static readonly ARMOR: number = 0.5;
    private static readonly MASS: number = 0.9;
    private static readonly ARMOR_STRENGTH: number = 20;
    private static readonly NUM: number = 5;

    public get health(): number { return HullModel5.HEALTH }
    public get armor(): number { return HullModel5.ARMOR }
    public get mass(): number { return HullModel5.MASS }
    public get armorStrength(): number { return HullModel5.ARMOR_STRENGTH }
    public get num(): number { return HullModel5.NUM }
}

export class HullModel6 implements IHull {
    private static readonly HEALTH: number = 100;
    private static readonly ARMOR: number = 0.6;
    private static readonly MASS: number = 0.95;
    private static readonly ARMOR_STRENGTH: number = 22;
    private static readonly NUM: number = 6;

    public get health(): number { return HullModel6.HEALTH }
    public get armor(): number { return HullModel6.ARMOR }
    public get mass(): number { return HullModel6.MASS }
    public get armorStrength(): number { return HullModel6.ARMOR_STRENGTH }
    public get num(): number { return HullModel6.NUM }
}

export class HullModel7 implements IHull {
    private static readonly HEALTH: number = 85;
    private static readonly ARMOR: number = 0.6;
    private static readonly MASS: number = 0.5;
    private static readonly ARMOR_STRENGTH: number = 25;
    private static readonly NUM: number = 7;

    public get health(): number { return HullModel7.HEALTH }
    public get armor(): number { return HullModel7.ARMOR }
    public get mass(): number { return HullModel7.MASS }
    public get armorStrength(): number { return HullModel7.ARMOR_STRENGTH }
    public get num(): number { return HullModel7.NUM }
}