import {MotionData} from "../../../additionally/type";
import {TrackSprite} from "../tank parts/TrackSprite";
import {IFrameByFrame} from "../../Sprite";

export class TankTrackEffect {
    private static readonly MIN_THRESHOLD_COEFF: number = 17.5;
    private static readonly MAX_THRESHOLD_COEFF: number = 0.5;
    private static readonly MIN_FRAME_CHANGE_THRESHOLD_MINIMUM: number = 2;
    private static readonly MAX_FRAME_CHANGE_THRESHOLD_MAXIMUM: number = 30;
    private _frame: number = 0;
    private _counter: number = 0;
    private _currentThreshold: number;
    private _isForwardMovement: boolean = true;
    public _isResidualMovement: boolean = false;
    private readonly _minFrameChangeThreshold: number[];
    private readonly _maxFrameChangeThreshold: number[];

    public constructor(forwardData: MotionData, backwardData: MotionData) {
        this._minFrameChangeThreshold = [
            Math.max(Math.round(TankTrackEffect.MIN_THRESHOLD_COEFF / backwardData.finishSpeed),
                TankTrackEffect.MIN_FRAME_CHANGE_THRESHOLD_MINIMUM),
            Math.max(Math.round(TankTrackEffect.MIN_THRESHOLD_COEFF / forwardData.finishSpeed),
                TankTrackEffect.MIN_FRAME_CHANGE_THRESHOLD_MINIMUM)
        ];

        this._maxFrameChangeThreshold = [
            Math.min(Math.round(TankTrackEffect.MAX_THRESHOLD_COEFF / backwardData.force),
                TankTrackEffect.MAX_FRAME_CHANGE_THRESHOLD_MAXIMUM),
            Math.min(Math.round(TankTrackEffect.MAX_THRESHOLD_COEFF / forwardData.force),
                TankTrackEffect.MAX_FRAME_CHANGE_THRESHOLD_MAXIMUM)
        ];

        this._currentThreshold = this._maxFrameChangeThreshold[this._isForwardMovement ? 1 : 0];
    }
    public set isForwardMovement(value: boolean) {
        this._isResidualMovement = false;
        if (this._isForwardMovement !== value) {
            this._isForwardMovement = value;
            this._currentThreshold = this._maxFrameChangeThreshold[this._isForwardMovement ? 1 : 0];
        }
    }
    public setResidualMovement() { this._isResidualMovement = true }
    public changeFrame(trackSprite1: IFrameByFrame, trackSprite2: IFrameByFrame) {
        this._counter++;
        if (this._counter >= this._currentThreshold) {
            this._counter = 0;
            this._frame ^= 1;
            trackSprite1.frame = this._frame;
            trackSprite2.frame = this._frame;
            if (this._isResidualMovement) {
                if (this._currentThreshold < this._maxFrameChangeThreshold[this._isForwardMovement ? 1 : 0])
                    this._currentThreshold++;
            }
            else if (this._currentThreshold > this._minFrameChangeThreshold[this._isForwardMovement ? 1 : 0])
                this._currentThreshold--;
        }
    }
    public stopped() {
        this._currentThreshold = this._maxFrameChangeThreshold[this._isForwardMovement ? 1 : 0];
    }
}