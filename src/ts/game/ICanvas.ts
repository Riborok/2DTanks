import {isImplementsIScalable, isImplementsIAnimatedSprite, isImplementsIVanish, ISprite,} from "../sprite/Sprite";
import {SpriteIDTracker} from "./id/SpriteIDTracker";
import {IStorage, Size} from "../additionally/type";
import {IIdentifiable} from "./id/IIdentifiable";

export interface IDrawable {
    drawAll(): void;
}

export interface IStorageWithIdRemoval<T extends IIdentifiable> extends IStorage<T> {
    removeById(identifiable: T): void;
}

export interface ICanvas extends IDrawable, IStorageWithIdRemoval<IIdentifiable>{
}

export class Canvas implements ICanvas {
    private readonly _ctx: CanvasRenderingContext2D;
    private readonly _size: Size;
    private readonly _bufferCanvas: HTMLCanvasElement;
    private readonly _bufferCtx: CanvasRenderingContext2D;
    private _sprites: Map<number, ISprite>[] = [];
    public constructor(ctx: CanvasRenderingContext2D, size: Size) {
        this._size = size;

        this._ctx = ctx;

        this._bufferCanvas = document.createElement("canvas");
        this._bufferCanvas.width = size.width;
        this._bufferCanvas.height = size.height;
        this._bufferCtx = this._bufferCanvas.getContext("2d");
    }
    public insert(sprite: ISprite) {
        const zIndex = SpriteIDTracker.extractZIndex(sprite.id);
        for (let i = this._sprites.length; i <= zIndex; i++)
            this._sprites.push(new Map<number, ISprite>());

        this._sprites[zIndex].set(sprite.id, sprite);
    }
    public remove(sprite: ISprite) {
        this.removeById(sprite);
    }
    public removeById(identifiable: IIdentifiable) {
        const zIndex = SpriteIDTracker.extractZIndex(identifiable.id);

        this._sprites[zIndex].delete(identifiable.id);
    }
    public drawAll() {
        this._bufferCtx.clearRect(0, 0, this._size.width, this._size.height);

        for (const sprites of this._sprites)
            for (const sprite of sprites.values())
                this.draw(sprite);

        this._ctx.drawImage(this._bufferCanvas, 0, 0);
    }
    public clear() {
        this._sprites = [];
    }
    private draw(sprite: ISprite) {
        this._bufferCtx.save();

        const halfWidth = sprite.width / 2;
        const halfHeight = sprite.height / 2;

        if (isImplementsIVanish(sprite))
            this._bufferCtx.globalAlpha = sprite.opacity;

        this._bufferCtx.translate(sprite.point.x + halfWidth, sprite.point.y + halfHeight);
        this._bufferCtx.rotate(sprite.angle);

        if (isImplementsIScalable(sprite))
            this._bufferCtx.scale(sprite.scaleX, sprite.scaleY);

        if (isImplementsIAnimatedSprite(sprite)) {
            this._bufferCtx.drawImage(
                sprite.sprite,
                sprite.frame * sprite.originalWidth,
                0,
                sprite.originalWidth,
                sprite.originalHeight,
                -halfWidth,
                -halfHeight,
                sprite.width,
                sprite.height
            );
        }
        else
            this._bufferCtx.drawImage(sprite.sprite, -halfWidth, -halfHeight, sprite.width, sprite.height);

        this._bufferCtx.restore();
    }
}