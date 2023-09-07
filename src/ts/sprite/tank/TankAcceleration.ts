import {Point} from "../../geometry/Point";
import {SpriteManipulator} from "../SpriteManipulator";
import {SpriteAcceleration} from "../effects/SpriteAcceleration";

export class TankAcceleration {
    private static readonly THRESHOLD: number = 7;
    private static readonly LAST_STATE: number = 19;
    private static readonly WORKING_STATE: number = 10;

    private readonly _topSpriteAccelerationEffect: SpriteAcceleration = new SpriteAcceleration()
    private readonly _bottomSpriteAccelerationEffect: SpriteAcceleration = new SpriteAcceleration();

    private _counter: number = 0;
    private _state: number = 0;
    private readonly _canvas: Element;
    private readonly _indentX: number;
    private readonly _tankHeight: number;
    public constructor(canvas: Element, indentX: number, tankHeight: number) {
        this._canvas = canvas;
        this._indentX = indentX;
        this._tankHeight = tankHeight;
    }
    private changeState() {
        if (this._state === TankAcceleration.LAST_STATE)
            this._state = TankAcceleration.WORKING_STATE;

        this._counter++;
        if (this._counter === TankAcceleration.THRESHOLD) {
            this._counter = 0;
            this._state++;
            this._topSpriteAccelerationEffect.setSrc(this._state);
            this._bottomSpriteAccelerationEffect.setSrc(this._state);
        }
    }
    public setPosition(hullDefaultPoint: Point, sin: number, cos: number, hullAngle: number) {
        if (this._state === 0 && this._counter === 0) {
            this._canvas.appendChild(this._topSpriteAccelerationEffect.sprite);
            this._canvas.appendChild(this._bottomSpriteAccelerationEffect.sprite);
        }
        this.changeState();

        let position = this.calcPosition(hullDefaultPoint, sin, cos, this._tankHeight * 28 / 42);
        SpriteManipulator.updateSpritePart(this._topSpriteAccelerationEffect, position, sin, cos, hullAngle);

        position = this.calcPosition(hullDefaultPoint, sin, cos, this._tankHeight * 37 / 42);
        SpriteManipulator.updateSpritePart(this._bottomSpriteAccelerationEffect, position, sin, cos, hullAngle);
    }
    public removeAcceleration() {
        if (this._state === 0 && this._counter === 0)
            return;

        this._state = 0;
        this._counter = 0;

        const topSpriteAccelerationEffect = this._topSpriteAccelerationEffect;
        const bottomSpriteAccelerationEffect = this._bottomSpriteAccelerationEffect;

        topSpriteAccelerationEffect.setSrc(this._state);
        bottomSpriteAccelerationEffect.setSrc(this._state);

        topSpriteAccelerationEffect.sprite.remove();
        bottomSpriteAccelerationEffect.sprite.remove();
    }
    private calcPosition(point: Point, sin: number, cos: number, indentY: number): Point {
        return new Point(
            point.x + this._indentX * cos - indentY * sin -
            SpriteAcceleration.SIZE / 2 * cos + SpriteAcceleration.SIZE / 1.517 * sin,
            point.y + indentY * cos + this._indentX * sin -
            SpriteAcceleration.SIZE / 1.517 * cos - SpriteAcceleration.SIZE / 2 * sin
        );
    }
}