import {IComponent} from "../IComponent";

export interface IBullet extends IComponent{
    get startingSpeed(): number;
    get health(): number;
    get damage(): number;
    get armorPenetration(): number;
    get mass(): number;
}

export class LightBullet implements IBullet {
    public get startingSpeed(): number { return 35 }
    public get damage(): number { return 15 }
    public get armorPenetration(): number { return 0.1 }
    public get mass(): number { return 0.008 }
    public get health(): number { return 1 }
    public get num(): number { return 0 }
}