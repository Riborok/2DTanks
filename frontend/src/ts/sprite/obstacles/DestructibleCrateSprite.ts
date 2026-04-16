import { Sprite } from '../ISprite';
import { ResolutionManager } from '../../constants/gameConstants';

/** Подвижная / разрушаемая коробка на арене (отдельный ассет от стен). */
export class DestructibleCrateSprite extends Sprite {
    public constructor() {
        const shapeNum = 1;
        const zIndex = 4;
        super(ResolutionManager.WALL_WIDTH[shapeNum], ResolutionManager.WALL_HEIGHT[shapeNum], zIndex);
        this._imgSprite.src = '/src/img/blocks/destructible_crate.png';
    }
}
