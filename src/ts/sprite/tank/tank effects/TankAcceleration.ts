import {Point} from "../../../geometry/Point";
import {SpriteManipulator} from "../../SpriteManipulator";
import {SpriteAcceleration} from "../../effects/SpriteAcceleration";
import {ResolutionManager} from "../../../constants/gameConstants"
import {IStorage} from "../../../additionally/type";
import {ISprite} from "../../Sprite";

export class TankAcceleration {
    private static readonly THRESHOLD: number = 7;
    private static readonly LAST_Frame: number = 19;
    private static readonly WORKING_Frame: number = 10;

    private readonly _topSpriteAccelerationEffect: SpriteAcceleration = new SpriteAcceleration()
    private readonly _bottomSpriteAccelerationEffect: SpriteAcceleration = new SpriteAcceleration();

    private _counter: number = 0;
    private _frame: number = 0;
    private readonly _storage: IStorage<ISprite>;
    private readonly _indentX: number;
    private readonly _tankHeight: number;
    public constructor(storage: IStorage<ISprite>, indentX: number, tankHeight: number) {
        this._storage = storage;
        this._indentX = indentX;
        this._tankHeight = tankHeight;
    }
    private changeFrame() {
        if (this._frame === TankAcceleration.LAST_Frame)
            this._frame = TankAcceleration.WORKING_Frame;

        this._counter++;
        if (this._counter === TankAcceleration.THRESHOLD) {
            this._counter = 0;
            this._frame++;
            this._topSpriteAccelerationEffect.frame = this._frame;
            this._bottomSpriteAccelerationEffect.frame = this._frame;
        }
    }
    public setPosition(hullDefaultPoint: Point, sin: number, cos: number, hullAngle: number) {
        if (this._frame === 0 && this._counter === 0) {
            this._storage.insert(this._topSpriteAccelerationEffect);
            this._storage.insert(this._bottomSpriteAccelerationEffect);
        }
        this.changeFrame();

        let position = this.calcPosition(hullDefaultPoint, sin, cos, this._tankHeight * 28 / 42);
        SpriteManipulator.updateSpritePart(this._topSpriteAccelerationEffect, position, sin, cos, hullAngle);

        position = this.calcPosition(hullDefaultPoint, sin, cos, this._tankHeight * 37 / 42);
        SpriteManipulator.updateSpritePart(this._bottomSpriteAccelerationEffect, position, sin, cos, hullAngle);
    }
    public removeAcceleration() {
        if (this._frame === 0 && this._counter === 0)
            return;

        this._frame = 0;
        this._counter = 0;

        const topSpriteAccelerationEffect = this._topSpriteAccelerationEffect;
        const bottomSpriteAccelerationEffect = this._bottomSpriteAccelerationEffect;

        topSpriteAccelerationEffect.frame = this._frame;
        bottomSpriteAccelerationEffect.frame = this._frame;

        this._storage.remove(this._topSpriteAccelerationEffect);
        this._storage.remove(this._bottomSpriteAccelerationEffect);
    }
    private calcPosition(point: Point, sin: number, cos: number, indentY: number): Point {
        return new Point(
            point.x + this._indentX * cos - indentY * sin -
            ResolutionManager.ACCELERATION_SIZE / 2 * cos + ResolutionManager.ACCELERATION_SIZE / 1.517 * sin,
            point.y + indentY * cos + this._indentX * sin -
            ResolutionManager.ACCELERATION_SIZE / 1.517 * cos - ResolutionManager.ACCELERATION_SIZE / 2 * sin
        );
    }
}