import {
    IGetImgSprite,
    isImplementsIFrameByFrame,
    isImplementsIScalable,
    isImplementsIVanish,
    ISprite,
} from "../../sprite/ISprite";
import {SpriteIDTracker} from "../id/SpriteIDTracker";
import {IStorage, Size} from "../../additionally/type";
import {IIdentifiable} from "../id/IIdentifiable";
import {IRectangle} from "./shapes/IRectangle";

export interface IDrawable {
    drawAll(): void;
}

export interface IStorageWithIdRemoval<T extends IIdentifiable> extends IStorage<T> {
    removeById(identifiable: T): void;
}

export interface IShapeAdder {
    addRectangle(rect: IRectangle): void;
    /** Синее пульсирующее кольцо (щит): координаты уже в пикселях холста */
    addShieldRing(centerX: number, centerY: number, radius: number): void;
}

export interface ICanvas extends IDrawable, IStorageWithIdRemoval<IIdentifiable & IGetImgSprite>, IShapeAdder{
    get ctx(): CanvasRenderingContext2D;
}

export class Canvas implements ICanvas {
    private readonly _ctx: CanvasRenderingContext2D;
    private readonly _size: Size;
    private readonly _bufferCanvas: HTMLCanvasElement;
    private readonly _bufferCtx: CanvasRenderingContext2D;
    private readonly _rectangles: IRectangle[] = new Array<IRectangle>();
    private readonly _shieldRings: { cx: number; cy: number; r: number }[] = [];
    private readonly _sprites: Map<number, ISprite>[] = new Array<Map<number, ISprite>>();
    private _animationClockMs: number | null = null;
    public constructor(ctx: CanvasRenderingContext2D, size: Size) {
        this._size = size;
        this._ctx = ctx;
        this._ctx.clearRect(0, 0, this._size.width, this._size.height);

        this._bufferCanvas = document.createElement("canvas");
        this._bufferCanvas.width = size.width;
        this._bufferCanvas.height = size.height;
        const bufferCtx = this._bufferCanvas.getContext("2d");
        if (!bufferCtx) throw new Error("Failed to get 2d context");
        this._bufferCtx = bufferCtx;
    }
    public get ctx() { return this._ctx }
    public setAnimationClockMs(value: number | null): void {
        this._animationClockMs = value;
    }
    public insert(sprite: ISprite) {
        const zIndex = SpriteIDTracker.extractZIndex(sprite.id);
        for (let i = this._sprites.length; i <= zIndex; i++)
            this._sprites.push(new Map<number, ISprite>());

        if (sprite.imgSprite.complete)
            this._sprites[zIndex].set(sprite.id, sprite);
        else
            sprite.imgSprite.onload = () => { this._sprites[zIndex].set(sprite.id, sprite) };
    }
    public remove(sprite: ISprite) {
        this.removeById(sprite);
    }
    public removeById(identifiable: IIdentifiable & IGetImgSprite) {
        identifiable.imgSprite.onload = null;

        const zIndex = SpriteIDTracker.extractZIndex(identifiable.id);
        this._sprites[zIndex].delete(identifiable.id);
    }
    public drawAll() {
        // Clear buffer canvas before drawing (like original - ensures no traces left)
        this._bufferCtx.clearRect(0, 0, this._size.width, this._size.height);
        
        // Clear main canvas before drawing buffer (ensures clean frame)
        this._ctx.clearRect(0, 0, this._size.width, this._size.height);
        
        for (const sprites of this._sprites)
            for (const sprite of sprites.values()) {
                // Skip sprites without initialized point
                if (!sprite.point) {
                    console.warn('Skipping sprite without point:', sprite.id);
                    continue;
                }
                this.draw(sprite);
            }

        this.drawAdditionalShapes();

        // Letterbox: поля за пределами 1920×1080 — чёрные
        this._ctx.fillStyle = '#000000';
        this._ctx.fillRect(0, 0, this._size.width, this._size.height);
        this._ctx.drawImage(this._bufferCanvas, 0, 0);
    }
    private drawAdditionalShapes(){
        this.drawShieldRings();
        this.drawRectangles();

        this._rectangles.length = 0;
    }

    private drawShieldRings(): void {
        if (this._shieldRings.length === 0) {
            return;
        }
        const ctx = this._bufferCtx;
        const t = (this._animationClockMs ?? performance.now()) * 0.005;
        const pulse = 1 + 0.06 * Math.sin(t);
        ctx.save();
        for (const ring of this._shieldRings) {
            const r = ring.r * pulse;
            ctx.beginPath();
            ctx.arc(ring.cx, ring.cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.28)';
            ctx.lineWidth = 9;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(ring.cx, ring.cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(140, 235, 255, 0.92)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.restore();
        this._shieldRings.length = 0;
    }
    private drawRectangles(){
        for (const rect of this._rectangles){
            this._bufferCtx.fillStyle = rect.color;
            this._bufferCtx.fillRect(rect.point.x, rect.point.y, rect.width, rect.height);
        }
    }
    public addRectangle(rect: IRectangle){
        this._rectangles.push(rect);
    }
    public addShieldRing(centerX: number, centerY: number, radius: number): void {
        if (radius > 2) {
            this._shieldRings.push({ cx: centerX, cy: centerY, r: radius });
        }
    }
    public clear() {
        this._sprites.length = 0;
        this._rectangles.length = 0;
        this._shieldRings.length = 0;
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

        if (isImplementsIFrameByFrame(sprite)) {
            this._bufferCtx.drawImage(
                sprite.imgSprite,
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
            this._bufferCtx.drawImage(sprite.imgSprite, -halfWidth, -halfHeight, sprite.width, sprite.height);

        this._bufferCtx.restore();
    }
}
