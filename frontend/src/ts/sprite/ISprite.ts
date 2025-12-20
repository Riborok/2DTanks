import {Point} from "../geometry/Point";
import {SpriteIDTracker} from "../game/id/SpriteIDTracker";
import {IIdentifiable} from "../game/id/IIdentifiable";

export interface IFrameByFrame {
    set frame(value: number);
    get frame(): number;

    get originalWidth(): number;
    get originalHeight(): number;
}
export function isImplementsIFrameByFrame(obj: any): obj is IFrameByFrame {
    return (
        'frame' in obj &&
        'originalWidth' in obj &&
        'originalHeight' in obj
    );
}

export interface IVanish extends IIdentifiable {
    set opacity(value: number);
    get opacity(): number;
}
export function isImplementsIVanish(obj: any): obj is IVanish {
    return (
        'opacity' in obj
    );
}

export interface IScalable {
    get scaleX(): number;
    get scaleY(): number;
}
export function isImplementsIScalable(obj: any): obj is IScalable {
    return (
        'scaleX' in obj &&
        'scaleY' in obj
    );
}

export interface IGetImgSprite {
    get imgSprite(): HTMLImageElement;
}

export interface ISprite extends IIdentifiable, IGetImgSprite {
    get width(): number;
    get height(): number;

    get point(): Point;
    get angle(): number;

    set point(value: Point);
    set angle(value: number);
}

export abstract class Sprite implements ISprite {
    protected _imgSprite: HTMLImageElement;
    private readonly _id: number;

    protected _point!: Point;
    protected _angle!: number;
    protected constructor(width: number, height: number, zIndex: number) {
        this._imgSprite = new Image(width, height);
        this._imgSprite.classList.add('sprite');
        this._id = SpriteIDTracker.generate(zIndex);
    }
    public get imgSprite(): HTMLImageElement { return this._imgSprite }
    public get width(): number { return this._imgSprite.width }
    public get height(): number { return this._imgSprite.height }
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

export interface ISpriteParts {
    get getParts(): Iterable<ISpritePart>;
}