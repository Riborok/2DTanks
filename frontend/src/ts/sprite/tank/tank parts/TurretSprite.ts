import {
    gameImg,
    tankHullTurretPaletteSlot,
    tankHullTurretSpriteSuffix,
} from '../../../constants/gameAssets';
import {ISpritePart, Sprite} from "../../ISprite";
import {Point} from "../../../geometry/Point";
import {ResolutionManager} from "../../../constants/gameConstants";

export class TurretSprite extends Sprite implements ISpritePart {
    private readonly _indentX : number;
    private readonly _indentY : number;
    public constructor(color: number, num: number, indentX: number, indentY: number) {
        const zIndex: number = 5;
        super(ResolutionManager.TURRET_WIDTH[num], ResolutionManager.TURRET_HEIGHT[num], zIndex);
        const primary = tankHullTurretSpriteSuffix(color);
        const legacy = tankHullTurretPaletteSlot(color);
        const primaryUrl = gameImg(`tanks/Turrets/Turret_${num}/Turret_${primary}.png`);
        const legacyUrl = gameImg(`tanks/Turrets/Turret_${num}/Turret_${legacy}.png`);
        let loadAttempt = 0;
        this._imgSprite.onerror = () => {
            loadAttempt += 1;
            if (loadAttempt === 1 && primary !== legacy) {
                this._imgSprite.src = primaryUrl;
            }
        };
        this._imgSprite.src = legacyUrl;
        this._indentX = indentX;
        this._indentY = indentY;
    }
    /**
     * Calculates the initial position of the turret sprite based on a reference point,
     * while considering the rotation angle represented by sine and cosine values.
     * @param point The reference point, which is the starting point of the hull, for position calculation.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @returns The calculated initial position of the turret sprite.
     */
    public calcPosition(point: Point, sin: number, cos: number): Point {
        return new Point(
            point.x + this._indentX * cos - this._indentY * sin,
            point.y + this._indentY * cos + this._indentX * sin
        );
    }
}