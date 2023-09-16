import {IBullet, LightBullet} from "../../components/bullet/IBullet";
import {BulletModel} from "./BulletModel";
import {RectangularEntity} from "../../entitiy/IEntity";
import {BULLET_HEIGHT, BULLET_WIDTH} from "../../constants/gameConstants";
import {IDTracker} from "../../game/id/IDTracker";
import {Point} from "../../geometry/Point";
import {IWeapon} from "../../components/tank parts/IWeapon";
import {PointRotator} from "../../geometry/PointRotator";

export class BulletModelCreator {
    private constructor() { }
    public static create(num: number, point: Point, angle: number, weapon: IWeapon): BulletModel {
        const bullet = BulletModelCreator.createBullet(num);

        const newPoint = BulletModelCreator.calcDefaultEntityPoint(num, point, angle);

        const entity = new RectangularEntity(newPoint, BULLET_WIDTH[num], BULLET_HEIGHT[num],
            angle, bullet.mass, IDTracker.bulletId);

        const speed = bullet.startingSpeed * weapon.startingSpeedCoeff;
        entity.velocity.x = speed * Math.cos(angle);
        entity.velocity.y = speed * Math.sin(angle);

        return new BulletModel(
            bullet,
            entity,
            weapon
        );
    }
    private static calcDefaultEntityPoint(num: number, point: Point, angle: number): Point{
        const newPoint: Point = new Point(
            point.x + BULLET_HEIGHT[num] / 2 * Math.sin(angle),
            point.y - BULLET_HEIGHT[num] / 2 * Math.cos(angle)
        );

        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const center = new Point(newPoint.x + BULLET_WIDTH[num] / 2 * cos - BULLET_HEIGHT[num] / 2 * sin,
            newPoint.y + BULLET_HEIGHT[num] / 2 * cos + BULLET_WIDTH[num] / 2 * sin);
        PointRotator.rotatePointAroundTarget(newPoint, center, -sin, cos);

        return newPoint;
    }
    private static createBullet(num: number): IBullet {
        switch (num) {
            case 0:
                return new LightBullet();
            default:
                throw new Error(`Bullet model ${num} was not found`);
        }
    }
}