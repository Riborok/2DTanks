import { Bonus } from '../../constants/gameConstants';
import { Point } from '../../geometry/Point';
import { PickupItemSprite, pickupItemImageSrc, pickupItemSize } from './PickupItemSprite';

export class BoxSprite extends PickupItemSprite {
    public constructor(bulletType: Bonus, point: Point, angle: number, itemId = 0) {
        super(
            point,
            pickupItemImageSrc(bulletType),
            pickupItemSize(bulletType),
            (itemId % 628) * 0.01
        );
        this.angle = angle;
    }
}
