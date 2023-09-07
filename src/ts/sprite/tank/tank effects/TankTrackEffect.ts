import {MotionData} from "../../../additionally/type";
import {TrackSprite} from "../tank parts/TrackSprite";

export class TankTrackEffect {
    private static readonly MIN_THRESHOLD_COEFF: number = 17.5;
    private static readonly MAX_THRESHOLD_COEFF: number = 0.5;
    private static readonly MIN_STATE_CHANGE_THRESHOLD_MINIMUM: number = 2;
    private static readonly MAX_STATE_CHANGE_THRESHOLD_MAXIMUM: number = 30;
    private _state: number = 0;
    private _counter: number = 0;
    private _currentThreshold: number;
    private _isForwardMovement: boolean = true;
    public _isResidualMovement: boolean = false;
    private readonly _minStateChangeThreshold: number[];
    private readonly _maxStateChangeThreshold: number[];

    public constructor(forwardData: MotionData, backwardData: MotionData) {
        this._minStateChangeThreshold = [
            Math.max(Math.round(TankTrackEffect.MIN_THRESHOLD_COEFF / backwardData.finishSpeed),
                TankTrackEffect.MIN_STATE_CHANGE_THRESHOLD_MINIMUM),
            Math.max(Math.round(TankTrackEffect.MIN_THRESHOLD_COEFF / forwardData.finishSpeed),
                TankTrackEffect.MIN_STATE_CHANGE_THRESHOLD_MINIMUM)
        ];

        this._maxStateChangeThreshold = [
            Math.min(Math.round(TankTrackEffect.MAX_THRESHOLD_COEFF / backwardData.force),
                TankTrackEffect.MAX_STATE_CHANGE_THRESHOLD_MAXIMUM),
            Math.min(Math.round(TankTrackEffect.MAX_THRESHOLD_COEFF / forwardData.force),
                TankTrackEffect.MAX_STATE_CHANGE_THRESHOLD_MAXIMUM)
        ];

        this._currentThreshold = this._maxStateChangeThreshold[this._isForwardMovement ? 1 : 0];
    }
    public set isForwardMovement(value: boolean) {
        this._isResidualMovement = false;
        if (this._isForwardMovement !== value) {
            this._isForwardMovement = value;
            this._currentThreshold = this._maxStateChangeThreshold[this._isForwardMovement ? 1 : 0];
        }
    }
    public setResidualMovement() { this._isResidualMovement = true }
    public changeState(trackSprite1: TrackSprite, trackSprite2: TrackSprite) {
        this._counter++;
        if (this._counter >= this._currentThreshold) {
            this._counter = 0;
            this._state ^= 1;
            trackSprite1.setSrc(this._state);
            trackSprite2.setSrc(this._state);
            if (this._isResidualMovement) {
                if (this._currentThreshold < this._maxStateChangeThreshold[this._isForwardMovement ? 1 : 0])
                    this._currentThreshold++;
            }
            else if (this._currentThreshold > this._minStateChangeThreshold[this._isForwardMovement ? 1 : 0])
                this._currentThreshold--;
        }
    }
    public stopped() {
        this._currentThreshold = this._maxStateChangeThreshold[this._isForwardMovement ? 1 : 0];
    }
}