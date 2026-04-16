import {IComponent} from "../IComponent";

export interface IHull extends IComponent{
    health: number;
    armor: number;
    mass: number;
    armorStrength: number;
}

/** Корпуса 0–7: от лёгкого разведчика до тяжёлого; масса влияет на инерцию, armorStrength — на поглощение урона. */
export class HullModel0 implements IHull {
    private static readonly HEALTH: number = 100;
    private static readonly ARMOR: number = 1;
    private static readonly MASS: number = 0.82;
    private static readonly ARMOR_STRENGTH: number = 22;
    private static readonly NUM: number = 0;

    public health: number = HullModel0.HEALTH;
    public armor: number = HullModel0.ARMOR;
    public mass: number = HullModel0.MASS;
    public armorStrength: number = HullModel0.ARMOR_STRENGTH;
    public get num(): number { return HullModel0.NUM }
}

export class HullModel1 implements IHull {
    private static readonly HEALTH: number = 92;
    private static readonly ARMOR: number = 1.12;
    private static readonly MASS: number = 0.78;
    private static readonly ARMOR_STRENGTH: number = 24;
    private static readonly NUM: number = 1;
    public health: number = HullModel1.HEALTH;
    public armor: number = HullModel1.ARMOR;
    public mass: number = HullModel1.MASS;
    public armorStrength: number = HullModel1.ARMOR_STRENGTH;
    public get num(): number { return HullModel1.NUM }
}

export class HullModel2 implements IHull {
    private static readonly HEALTH: number = 135;
    private static readonly ARMOR: number = 1.05;
    private static readonly MASS: number = 1.22;
    private static readonly ARMOR_STRENGTH: number = 21;
    private static readonly NUM: number = 2;
    public health: number = HullModel2.HEALTH;
    public armor: number = HullModel2.ARMOR;
    public mass: number = HullModel2.MASS;
    public armorStrength: number = HullModel2.ARMOR_STRENGTH;
    public get num(): number { return HullModel2.NUM }
}

export class HullModel3 implements IHull {
    private static readonly HEALTH: number = 108;
    private static readonly ARMOR: number = 1.32;
    private static readonly MASS: number = 1.12;
    private static readonly ARMOR_STRENGTH: number = 26;
    private static readonly NUM: number = 3;
    public health: number = HullModel3.HEALTH;
    public armor: number = HullModel3.ARMOR;
    public mass: number = HullModel3.MASS;
    public armorStrength: number = HullModel3.ARMOR_STRENGTH;
    public get num(): number { return HullModel3.NUM }
}

export class HullModel4 implements IHull {
    private static readonly HEALTH: number = 90;
    private static readonly ARMOR: number = 0.88;
    private static readonly MASS: number = 0.62;
    private static readonly ARMOR_STRENGTH: number = 19;
    private static readonly NUM: number = 4;
    public health: number = HullModel4.HEALTH;
    public armor: number = HullModel4.ARMOR;
    public mass: number = HullModel4.MASS;
    public armorStrength: number = HullModel4.ARMOR_STRENGTH;
    public get num(): number { return HullModel4.NUM }
}

export class HullModel5 implements IHull {
    private static readonly HEALTH: number = 96;
    private static readonly ARMOR: number = 0.72;
    private static readonly MASS: number = 0.68;
    private static readonly ARMOR_STRENGTH: number = 21;
    private static readonly NUM: number = 5;
    public health: number = HullModel5.HEALTH;
    public armor: number = HullModel5.ARMOR;
    public mass: number = HullModel5.MASS;
    public armorStrength: number = HullModel5.ARMOR_STRENGTH;
    public get num(): number { return HullModel5.NUM }
}

export class HullModel6 implements IHull {
    private static readonly HEALTH: number = 102;
    private static readonly ARMOR: number = 0.82;
    private static readonly MASS: number = 0.78;
    private static readonly ARMOR_STRENGTH: number = 23;
    private static readonly NUM: number = 6;
    public health: number = HullModel6.HEALTH;
    public armor: number = HullModel6.ARMOR;
    public mass: number = HullModel6.MASS;
    public armorStrength: number = HullModel6.ARMOR_STRENGTH;
    public get num(): number { return HullModel6.NUM }
}

export class HullModel7 implements IHull {
    private static readonly HEALTH: number = 84;
    private static readonly ARMOR: number = 0.58;
    private static readonly MASS: number = 0.52;
    private static readonly ARMOR_STRENGTH: number = 22;
    private static readonly NUM: number = 7;
    public health: number = HullModel7.HEALTH;
    public armor: number = HullModel7.ARMOR;
    public mass: number = HullModel7.MASS;
    public armorStrength: number = HullModel7.ARMOR_STRENGTH;
    public get num(): number { return HullModel7.NUM }
}

