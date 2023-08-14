

class TrackSprite extends Sprite {
    private readonly _srcState0: string;
    private readonly _srcState1: string;
    private _state: number;
    public constructor(num: number, width: number, height: number) {
        super();

        this._srcState0 = `src/img/tanks/Tracks/Track_${num}_A.png`;
        this._srcState1 = `src/img/tanks/Tracks/Track_${num}_B.png`;
        this._state = 0;
        this._sprite.src = this._srcState0;
        this._sprite.style.width = `${width}px`;
        this._sprite.style.height = `${height}px`;
    }

    public setPosition(x: number, y: number) {
        this.changeState();
        //
    }
    public setAngle(angle: number) {
        this.changeState();
        //
    }
    private changeState() {
        this._state++; this._state %= 2;
        if (this._state === 1)
            this._sprite.src = this._srcState1;
        else
            this._sprite.src = this._srcState0;
    }
}