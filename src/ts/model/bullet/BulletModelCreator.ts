import {IBullet, LightBullet} from "../../components/bullet/IBullet";
import {BulletModel} from "./BulletModel";
import {RectangularEntity} from "../../entitiy/IEntity";
import {BULLET_HEIGHT, BULLET_WIDTH} from "../../constants/gameConstants";
import {IDTracker} from "../../game/id/IDTracker";
import {Point} from "../../geometry/Point";
import {IWeapon} from "../../components/tank parts/IWeapon";

export class BulletModelCreator {
    private constructor() { }
    public static create(num: number, point: Point, angle: number, weapon: IWeapon): BulletModel {
        const bullet = BulletModelCreator.createBullet(num);
        const entity = new RectangularEntity(point, BULLET_WIDTH[num], BULLET_HEIGHT[num],
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
    private static createBullet(num: number): IBullet {
        switch (num) {
            case 0:
                return new LightBullet();
            default:
                throw new Error(`Bullet model ${num} was not found`);
        }
    }
}