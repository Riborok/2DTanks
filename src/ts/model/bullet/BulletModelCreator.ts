import {Bullet, LightBullet} from "./Bullet";
import {BulletModel} from "./BulletModel";
import {RectangularEntity} from "../entitiy/IEntity";
import {BULLET_HEIGHT, BULLET_WIDTH} from "../../constants/gameConstants";
import {IDTracker} from "../../game/id/IDTracker";
import {Point} from "../../geometry/Point";

export class BulletModelCreator {
    private constructor() { }
    public static create(num: number, point: Point, angle: number): BulletModel {
        const bullet = BulletModelCreator.createBullet(num);
        return new BulletModel(
            bullet,
            new RectangularEntity(point, BULLET_WIDTH[num], BULLET_HEIGHT[num], angle, bullet.mass, IDTracker.bulletId)
        );
    }
    private static createBullet(num: number): Bullet {
        switch (num) {
            case 0:
                return new LightBullet();
            default:
                throw new Error(`Bullet model ${num} was not found`);
        }
    }
}