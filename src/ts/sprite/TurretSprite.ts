import {Sprite} from "./Sprite";
import {Point} from "../model/Point";

export class TurretSprite extends Sprite {
    public static readonly WIDTH: number[] = [43, 50, 36, 36, 29, 36, 43, 29];
    public static readonly HEIGHT: number[] = [36, 36, 22, 36, 29, 29, 36, 29];
    private readonly _indentX : number;
    private readonly _indentY : number;
    public constructor(color: number, num: number, indentX: number, indentY: number) {
        super(TurretSprite.WIDTH[num], TurretSprite.HEIGHT[num]);
        this._sprite.src = `src/img/tanks/Turrets/Turret_${num}/Turret_${color}.png`;
        this._indentX = indentX;
        this._indentY = indentY;
    }
    public calcPosition(point: Point, angle: number): Point {
        return new Point(
            point.x + this._indentX * Math.cos(angle) + this._indentY * Math.sin(angle),
            point.y + this._indentY * Math.cos(angle) - this._indentX * Math.sin(angle)
        );
    }
}