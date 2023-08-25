import {TankSpritePart} from "./Sprite";
import {Point} from "../model/Point";

export abstract class SpriteAccelerationEffect extends TankSpritePart {
    private static readonly THRESHOLD: number = 7;
    private static readonly LAST_STATE: number = 19;
    private static readonly WORKING_STATE: number = 10;
    private static readonly DEFAULT_SRC : string = 'src/img/tanks/Effects/Movement/Movement_';
    private static readonly SRC: string[] = [
        `${SpriteAccelerationEffect.DEFAULT_SRC}0.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}1.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}2.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}3.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}4.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}5.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}6.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}7.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}8.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}9.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}10.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}11.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}12.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}13.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}14.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}15.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}16.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}17.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}18.png`,
        `${SpriteAccelerationEffect.DEFAULT_SRC}19.png`
    ];
    protected static readonly SIZE: number = 85;

    private _state: number;
    private _counter: number;
    private readonly _canvas: Element;
    protected _indentX: number;
    protected _indentY: number;
    protected constructor(canvas: Element, indentX: number, indentY: number) {
        super(SpriteAccelerationEffect.SIZE, SpriteAccelerationEffect.SIZE);
        this._canvas = canvas;
        this._indentX = indentX;
        this._indentY = indentY;
        this._sprite.style.zIndex = `4`;
        this._state = 0;
        this._counter = 0;
        this._sprite.src = SpriteAccelerationEffect.SRC[this._state];
    }
    private changeState() {
        if (this._state === SpriteAccelerationEffect.LAST_STATE)
            this._state = SpriteAccelerationEffect.WORKING_STATE;

        this._counter++;
        if (this._counter === SpriteAccelerationEffect.THRESHOLD) {
            this._counter = 0;
            this._state++;
            this._sprite.src = SpriteAccelerationEffect.SRC[this._state];
        }
    }
    public setPosition(point: Point) {
        if (this._state === 0 && this._counter === 0)
            this._canvas.appendChild(this._sprite);
        this.changeState();
        super.setPosition(point);
    }
    public removeAcceleration() {
        if (this._state === 0 && this._counter === 0)
            return

        this._state = 0;
        this._counter = 0;
        this._sprite.src = SpriteAccelerationEffect.SRC[this._state];
        this._sprite.remove();
    }
    public calcPosition(point: Point, sin: number, cos: number): Point {
        return new Point(
            point.x + this._indentX * cos - this._indentY * sin -
            SpriteAccelerationEffect.SIZE / 2 * cos + SpriteAccelerationEffect.SIZE / 1.517 * sin ,
            point.y + this._indentY * cos + this._indentX * sin -
            SpriteAccelerationEffect.SIZE / 1.517 * cos - SpriteAccelerationEffect.SIZE / 2 * sin
        );
    }
}

export class TopSpriteAccelerationEffect extends SpriteAccelerationEffect {
    public constructor(canvas: Element, indentX: number, tankWidth: number) {
        super(canvas, indentX, tankWidth * 9 / 16);
    }
}

export class BottomSpriteAccelerationEffect extends SpriteAccelerationEffect {
    public constructor(canvas: Element, indentX: number, tankWidth: number) {
        super(canvas, indentX, tankWidth * 7 / 16);
    }
}