import { Sprite } from '../ISprite';
import { ResolutionManager } from '../../constants/gameConstants';

/** Ассеты из `src/img/blocks/crate_pack/` (Kenney-style). */
const CRATE_SKIN_PATHS: readonly string[] = [
    '/src/img/blocks/crate_pack/obj_crate001.png',
    '/src/img/blocks/crate_pack/obj_crate002.png',
    '/src/img/blocks/crate_pack/obj_crate003.png',
    '/src/img/blocks/crate_pack/obj_crate004.png',
    '/src/img/blocks/crate_pack/obj_crate005.png',
    '/src/img/blocks/crate_pack/obj_box001.png',
    '/src/img/blocks/crate_pack/obj_box002.png',
    '/src/img/blocks/crate_pack/obj_box003.png',
    '/src/img/blocks/crate_pack/obj_box004.png',
    '/src/img/blocks/crate_pack/obj_box005.png'
];

/** Подвижная / разрушаемая коробка на арене (отдельный ассет от стен). */
export class DestructibleCrateSprite extends Sprite {
    public constructor(skinIndex: number = 0) {
        const shapeNum = 1;
        const zIndex = 4;
        super(ResolutionManager.WALL_WIDTH[shapeNum], ResolutionManager.WALL_HEIGHT[shapeNum], zIndex);
        const idx = Math.max(0, Math.min(CRATE_SKIN_PATHS.length - 1, Math.floor(skinIndex)));
        this._imgSprite.src = CRATE_SKIN_PATHS[idx]!;
    }
}
