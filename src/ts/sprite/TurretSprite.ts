import {Sprite} from "./Sprite";

export class TurretSprite extends Sprite {
    private static readonly WIDTH: number[] = [43, 50, 36, 36, 29, 36, 43, 29];
    private static readonly HEIGHT: number[] = [36, 36, 22, 36, 29, 29, 36, 29];
    private readonly _indentX : number;
    private readonly _indentY : number;
    public constructor(color: number, num: number, indentX: number, indentY: number) {
        super(TurretSprite.WIDTH[num], TurretSprite.HEIGHT[num]);
        this._sprite.src = `src/img/tanks/Turrets/Turret_${num}/Turret_${color}.png`;
        this._indentX = indentX;
        this._indentY = indentY;
    }
    public setPosition(x: number, y: number, angle: number) {
        const adjustedPos = this.calcPosition(x, y, angle);
        super.setPosition(adjustedPos.x, adjustedPos.y, angle);
    }
    public setAngle(x: number, y: number, angle: number) {
        const adjustedPos = this.calcPosition(x, y, angle);
        super.setPosition(adjustedPos.x, adjustedPos.y, angle);
        super.setAngle(adjustedPos.x, adjustedPos.y, angle);
    }
    private calcPosition(x: number, y: number, angle: number): { x: number, y: number } {
        const adjustedX = x + this._indentX * Math.cos(angle) + this._indentY * Math.sin(angle);
        const adjustedY = y + this._indentY * Math.cos(angle) - this._indentX * Math.sin(angle);
        return { x: adjustedX, y: adjustedY };
    }
}