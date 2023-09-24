import {IComponent} from "../IComponent";

export interface IHull extends IComponent{
    get health(): number;
    get armor(): number;
    get mass(): number;
    get armorStrength(): number;
}

export class HullModel0 implements IHull {
    public get health(): number { return 100 }
    public get armor(): number { return 10 }
    public get mass(): number { return 1 }
    public get armorStrength(): number { return 1 }
    public get num(): number { return 0 }
}