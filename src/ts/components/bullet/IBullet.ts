import {MotionData} from "../../additionally/type";
import {IComponent} from "../IComponent";

export interface IBullet extends IComponent{
    get motionData(): MotionData;
    get health(): number;
    get damage(): number;
    get armorPenetration(): number;
    get mass(): number;
}

export class LightBullet implements IBullet {
    private _motionData: MotionData = { force: 1, finishSpeed: 20 }
    public get motionData(): MotionData { return this._motionData }
    public get damage(): number { return 15 }
    public get armorPenetration(): number { return 5 }
    public get mass(): number { return 0.0000015 }
    public get health(): number { return 1 }
    public get num(): number { return 0 }
}