import {IComponent} from "../IComponent";
import {Point} from "../../geometry/Point";
import {IEntity, RectangularEntity} from "../../polygon/entity/IEntity";
import {ModelIDTracker} from "../../utils/IDTracker";

export interface IBullet extends IComponent {
    startingSpeed: number;
    health: number;
    damage: number;
    armorPenetration: number;
    mass: number;
}

export interface IExplosiveBullet {
    createAffectedArea(center: Point, size: number, angle: number): IEntity;
}

export function isImplementsIExplosiveBullet(obj: any): obj is IExplosiveBullet {
    return ('createAffectedArea' in obj);
}

export class LightBullet implements IBullet {
    private static readonly STARTING_SPEED: number = 45;
    private static readonly DAMAGE: number = 12;
    private static readonly ARMOR_PENETRATION: number = 0.05;
    private static readonly MASS: number = 0.008;
    private static readonly HEALTH: number = 5;
    private static readonly NUM: number = 0;

    public startingSpeed: number = LightBullet.STARTING_SPEED;
    public damage: number = LightBullet.DAMAGE;
    public armorPenetration: number = LightBullet.ARMOR_PENETRATION;
    public mass: number = LightBullet.MASS;
    public health: number = LightBullet.HEALTH;
    public get num(): number { return LightBullet.NUM }
}

export class MediumBullet implements IBullet {
    private static readonly STARTING_SPEED: number = 35;
    private static readonly DAMAGE: number = 25;
    private static readonly ARMOR_PENETRATION: number = 0.1;
    private static readonly MASS: number = 0.02;
    private static readonly HEALTH: number = 10;
    private static readonly NUM: number = 1;

    public startingSpeed: number = MediumBullet.STARTING_SPEED;
    public damage: number = MediumBullet.DAMAGE;
    public armorPenetration: number = MediumBullet.ARMOR_PENETRATION;
    public mass: number = MediumBullet.MASS;
    public health: number = MediumBullet.HEALTH;
    public get num(): number { return MediumBullet.NUM }
}

export class HeavyBullet implements IBullet {
    private static readonly STARTING_SPEED: number = 15;
    private static readonly DAMAGE: number = 50;
    private static readonly ARMOR_PENETRATION: number = 0.2;
    private static readonly MASS: number = 0.05;
    private static readonly HEALTH: number = 20;
    private static readonly NUM: number = 2;

    public startingSpeed: number = HeavyBullet.STARTING_SPEED;
    public damage: number = HeavyBullet.DAMAGE;
    public armorPenetration: number = HeavyBullet.ARMOR_PENETRATION;
    public mass: number = HeavyBullet.MASS;
    public health: number = HeavyBullet.HEALTH;
    public get num(): number { return HeavyBullet.NUM }
}

export class SniperBullet implements IBullet {
    private static readonly STARTING_SPEED: number = 75;
    private static readonly DAMAGE: number = 35;
    private static readonly ARMOR_PENETRATION: number = 0.5;
    private static readonly MASS: number = 0.01;
    private static readonly HEALTH: number = 6;
    private static readonly NUM: number = 3;

    public startingSpeed: number = SniperBullet.STARTING_SPEED;
    public damage: number = SniperBullet.DAMAGE;
    public armorPenetration: number = SniperBullet.ARMOR_PENETRATION;
    public mass: number = SniperBullet.MASS;
    public health: number = SniperBullet.HEALTH;
    public get num(): number { return SniperBullet.NUM }
}

export class GrenadeBullet implements IBullet, IExplosiveBullet {
    private static readonly STARTING_SPEED: number = 10;
    private static readonly DAMAGE: number = 40;
    private static readonly ARMOR_PENETRATION: number = 0.25;
    private static readonly MASS: number = 0.035;
    private static readonly HEALTH: number = 15;
    private static readonly NUM: number = 4;

    public startingSpeed: number = GrenadeBullet.STARTING_SPEED;
    public damage: number = GrenadeBullet.DAMAGE;
    public armorPenetration: number = GrenadeBullet.ARMOR_PENETRATION;
    public mass: number = GrenadeBullet.MASS;
    public health: number = GrenadeBullet.HEALTH;
    public get num(): number { return GrenadeBullet.NUM }
    
    public createAffectedArea(center: Point, size: number, angle: number): IEntity {
        const point = new Point(center.x - size / 2, center.y - size / 2);
        return new RectangularEntity(
            point,
            size,
            size,
            angle,
            this.mass,
            ModelIDTracker.otherId
        );
    }
}


