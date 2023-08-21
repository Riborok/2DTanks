import {TankSpritePart} from "./Sprite";
import {Point} from "../model/Point";
import {TURRET_HEIGHT, TURRET_WIDTH} from "../constants";

export class TurretSprite extends TankSpritePart {
    private readonly _indentX : number;
    private readonly _indentY : number;
    public constructor(color: number, num: number, indentX: number, indentY: number) {
        super(TURRET_WIDTH[num], TURRET_HEIGHT[num]);
        this._sprite.src = `src/img/tanks/Turrets/Turret_${num}/Turret_${color}.png`;
        this._indentX = indentX;
        this._indentY = indentY;
    }
    public override calcPosition(point: Point, angle: number): Point {
        return new Point(
            point.x + this._indentX * Math.cos(angle) - this._indentY * Math.sin(angle),
            point.y + this._indentY * Math.cos(angle) + this._indentX * Math.sin(angle)
        );
    }
}