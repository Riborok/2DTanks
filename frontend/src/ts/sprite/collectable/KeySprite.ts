import { gameImg } from '../../constants/gameAssets';
import { ResolutionManager } from '../../constants/gameConstants';
import { Point } from '../../geometry/Point';
import { PickupItemSprite } from './PickupItemSprite';

export class KeySprite extends PickupItemSprite {
    public constructor(point: Point, angle: number, phaseSeed = 0) {
        super(point, gameImg('item/Key.png'), ResolutionManager.KEY_SIZE, phaseSeed);
        this.angle = angle;
    }
}
