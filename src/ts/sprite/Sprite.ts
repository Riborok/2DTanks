import {Point} from "../geometry/Point";
import {SpriteIDTracker} from "../game/id/SpriteIDTracker";
import {IIdentifiable} from "../game/id/IIdentifiable";

export interface ISprite extends IIdentifiable {
    get width(): number;
    get height(): number;
    get sprite(): HTMLImageElement;

    get point(): Point;
    get angle(): number;
    get scaleX(): number;
    get scaleY(): number;
    get opacity(): number;

    set point(value: Point);
    set angle(value: number);
    set opacity(value: number);
}

export abstract class Sprite implements ISprite {
    protected _sprite: HTMLImageElement;
    private readonly _id: number;

    protected _point: Point;
    protected _angle: number;
    protected _scaleX: number = 1;
    protected _scaleY: number = 1;
    protected _opacity: number = 1;
    protected constructor(width: number, height: number, zIndex: number) {
        this._sprite = new Image(width, height);
        this._sprite.classList.add('sprite');
        this._id = SpriteIDTracker.generate(zIndex);
    }
    public get width(): number { return this._sprite.width }
    public get height(): number { return this._sprite.height }
    public get sprite(): HTMLImageElement { return this._sprite }
    public get id(): number { return this._id }

    public get point(): Point { return this._point }
    public get angle(): number { return this._angle }
    public get scaleX(): number { return this._scaleX }
    public get scaleY(): number { return this._scaleY }
    public get opacity(): number { return this._opacity }

    public set point(value: Point) { this._point = value }
    public set angle(value: number) { this._angle = value }
    public set opacity(value: number) { this._opacity = value }
}

export interface ISpritePart {
    /**
     * Calculates the initial position of the sprite part based on a reference point,
     * while taking into account the rotation angle represented by sine and cosine values.
     * @param point The reference point around which the part's position is calculated.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @returns The calculated initial position of the sprite part.
     */
    calcPosition(point: Point, sin: number, cos: number): Point;
}