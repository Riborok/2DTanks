import {TankSprite} from "./TankSprite";
import {Sprite} from "./Sprite";

abstract class TrackSprite extends Sprite {
    protected readonly _srcState0: string;
    protected readonly _srcState1: string;
    protected _state: number;

    protected abstract calcPosition(x: number, y: number, angle: number): { x: number, y: number };
    protected constructor(num: number, width: number, height: number) {
        super(width, height);

        this._srcState0 = `src/img/tanks/Tracks/Track_${num}_A.png`;
        this._srcState1 = `src/img/tanks/Tracks/Track_${num}_B.png`;
        this._state = 0;
        this._sprite.src = this._srcState0;
    }
    protected changeState() {
        this._state++; this._state %= 2;
        if (this._state === 1)
            this._sprite.src = this._srcState1;
        else
            this._sprite.src = this._srcState0;
    }
    public setPosition(x: number, y: number, angle: number) {
        this.changeState();
        const adjustedPos = this.calcPosition(x, y, angle);
        super.setPosition(adjustedPos.x, adjustedPos.y, angle);
    }
    public setAngle(x: number, y: number, angle: number) {
        this.changeState();
        const adjustedPos = this.calcPosition(x, y, angle);
        super.setPosition(adjustedPos.x, adjustedPos.y, angle);
        super.setAngle(adjustedPos.x, adjustedPos.y, angle);
    }
}

export class UpTrackSprite extends TrackSprite  {
    public constructor(num: number, width: number, height: number) {
        super(num, width, height);
    }
    protected override calcPosition(x: number, y: number, angle: number): { x: number, y: number } {
        const adjustedX = x - TankSprite.TRACK_INDENT * Math.sin(angle);
        const adjustedY = y - TankSprite.TRACK_INDENT * Math.cos(angle);
        return { x: adjustedX, y: adjustedY };
    }
}
export class DownTrackSprite extends TrackSprite  {
    private readonly _deltaHeight: number;
    public constructor(num: number, width: number, height: number, tankHeight: number) {
        super(num, width, height);
        this._deltaHeight = tankHeight + TankSprite.TRACK_INDENT - height;
    }
    protected override calcPosition(x: number, y: number, angle: number): { x: number, y: number } {
        const adjustedX = x + this._deltaHeight * Math.sin(angle);
        const adjustedY = y + this._deltaHeight * Math.cos(angle);
        return { x: adjustedX, y: adjustedY };
    }
}