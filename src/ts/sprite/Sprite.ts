import {Point} from "../geometry/Point";
import {SpriteIDTracker} from "../game/id/SpriteIDTracker";
import {IIdentifiable} from "../game/id/IIdentifiable";

export interface IAnimatedSprite {
    set frame(value: number);
    get frame(): number;

    get originalWidth(): number;
    get originalHeight(): number;
}
export function isImplementsIAnimatedSprite(obj: any): obj is IAnimatedSprite {
    return (
        'frame' in obj &&
        'originalWidth' in obj &&
        'originalHeight' in obj &&
        typeof obj.frame === 'number' &&
        typeof obj.originalWidth === 'number' &&
        typeof obj.originalHeight === 'number'
    );
}

export interface IVanish extends IIdentifiable {
    set opacity(value: number);
    get opacity(): number;
}
export function isImplementsIVanish(obj: any): obj is IVanish {
    return (
        'opacity' in obj &&
        typeof obj.opacity === 'number'
    );
}

export interface IScalable {
    get scaleX(): number;
    get scaleY(): number;
}
export function isImplementsIScalable(obj: any): obj is IScalable {
    return (
        'scaleX' in obj &&
        'scaleY' in obj &&
        typeof obj.scaleX === 'number' &&
        typeof obj.scaleY === 'number'
    );
}

export interface ISprite extends IIdentifiable {
    get width(): number;
    get height(): number;
    get sprite(): HTMLImageElement;

    get point(): Point;
    get angle(): number;

    set point(value: Point);
    set angle(value: number);
}

export abstract class Sprite implements ISprite {
    protected _sprite: HTMLImageElement;
    private readonly _id: number;

    protected _point: Point;
    protected _angle: number;
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

    public set point(value: Point) { this._point = value }
    public set angle(value: number) { this._angle = value }
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