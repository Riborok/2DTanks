import {
    gameImg,
    tankHullTurretPaletteSlot,
    tankHullTurretSpriteSuffix,
} from '../../../constants/gameAssets';
import {ISpritePart, Sprite} from "../../ISprite";
import {ResolutionManager} from "../../../constants/gameConstants";
import {Point} from "../../../geometry/Point";

export class HullSprite extends Sprite implements ISpritePart {
    private readonly _accelerationEffectIndentX: number;
    public get accelerationEffectIndentX() { return this._accelerationEffectIndentX }
    public constructor(color: number, num: number) {
        const zIndex: number = 4;
        super(ResolutionManager.HULL_WIDTH[num], ResolutionManager.HULL_HEIGHT[num], zIndex);
        this._accelerationEffectIndentX = ResolutionManager.ACCELERATION_EFFECT_INDENT_X[num];
        const primary = tankHullTurretSpriteSuffix(color);
        const legacy = tankHullTurretPaletteSlot(color);
        const primaryUrl = gameImg(`tanks/Hulls/Hull_${num}/Hull_${primary}.png`);
        const legacyUrl = gameImg(`tanks/Hulls/Hull_${num}/Hull_${legacy}.png`);
        let loadAttempt = 0;
        this._imgSprite.onerror = () => {
            loadAttempt += 1;
            if (loadAttempt === 1 && primary !== legacy) {
                this._imgSprite.src = primaryUrl;
            }
        };
        this._imgSprite.src = legacyUrl;
    }
    /**
     * Calculates the initial position of the hull sprite based on a reference point,
     * while considering the rotation angle represented by sine and cosine values.
     * @param point The reference point, which is the starting point of the top track sprite, for position calculation.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @returns The calculated initial position of the hull sprite.
     */
    public calcPosition(point: Point, sin: number, cos: number): Point {
        return new Point(
            point.x - ResolutionManager.TRACK_INDENT * sin,
            point.y + ResolutionManager.TRACK_INDENT * cos
        );
    }
}