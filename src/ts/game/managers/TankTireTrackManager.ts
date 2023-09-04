import {Point} from "../../geometry/Point";
import {TireTrackChainSprite} from "../../sprite/effects/TireTrackChainSprite";
import {DoubleLinkedList} from "../../additionally/DoubleLinkedList";
import {SpriteManipulator} from "../../sprite/SpriteManipulator";
import {calcDistance} from "../../geometry/additionalFunc";
import {VanishingTireTracksManager} from "./VanishingTireTrackManager";
import {TankSpriteParts} from "../../sprite/tank/TankSpriteParts";

export type TirePair = { topTire: TireTrackChainSprite, bottomTire: TireTrackChainSprite }

export class TankTireTrackManager{
    private _listOfTirePairs : DoubleLinkedList<TirePair> = new DoubleLinkedList<TirePair>();
    private readonly _canvas: Element;
    private readonly _trackWidth: number;
    private readonly _trackHeight: number;
    private readonly _chainWidth: number;
    private _topFirstChainPoint: Point;
    private _topLastChainPoint: Point;
    private _bottomFirstChainPoint: Point;
    private _bottomLastChainPoint: Point;
    private _delayedHullAngle: number;
    private static readonly UPDATE_ANGLE_DIFFERENCE: number = 0.174533;
    private static readonly AMOUNT_OF_CHAINS: number = 10;
    get chainWidth () { return this._chainWidth }
    constructor(canvas: Element, trackWidth: number, trackHeight: number) {
        this._canvas = canvas;
        this._trackWidth = trackWidth;
        this._trackHeight = trackHeight;
        this._chainWidth = this.calcWidthOfChain();
    }
    private calcWidthOfChain(): number{
        return this._trackWidth / TankTireTrackManager.AMOUNT_OF_CHAINS;
    }
    public calcPositionOfFirstChain(point: Point, trackWidth: number, chainWidth: number,
                                    sin: number, cos: number): Point{
        return new Point(
            point.x + trackWidth * cos - chainWidth * cos,
            point.y + trackWidth * sin - chainWidth * sin
        );
    }
    private moveToNextChain(point: Point, sin: number, cos: number){
        point.x = point.x - this._chainWidth * cos;
        point.y = point.y - this._chainWidth * sin;
    }
    private createNewTireTrackPair(topPoint: Point, bottomPoint: Point, hullAngle: number, sin: number, cos: number): TirePair {
        const currTirePair = {
            topTire: new TireTrackChainSprite(this._chainWidth, this._trackHeight, 0),
            bottomTire: new TireTrackChainSprite(this._chainWidth, this._trackHeight, 0),
        }
        this._canvas.appendChild(currTirePair.topTire.sprite);
        this._canvas.appendChild(currTirePair.bottomTire.sprite);

        const rotatedTopPoint = topPoint.clone();
        const rotatedBottomPoint = bottomPoint.clone();

        SpriteManipulator.rotateForPoint(currTirePair.topTire, rotatedTopPoint, sin, cos);
        SpriteManipulator.rotateForPoint(currTirePair.bottomTire, rotatedBottomPoint, sin, cos);

        SpriteManipulator.setPosAndAngle(currTirePair.topTire, rotatedTopPoint, hullAngle);
        SpriteManipulator.setPosAndAngle(currTirePair.bottomTire, rotatedBottomPoint, hullAngle);

        return currTirePair;
    }
    public calcFirstTopBottomChainPoints(tankSpriteParts: TankSpriteParts, point: Point, sin: number, cos: number):
        {firstTopChainPoint: Point, firstBottomChainPoint: Point} {
        const firstTopChainPoint = this.calcPositionOfFirstChain(point,
            this._trackWidth, this.chainWidth, sin, cos);
        const hullDefaultPoint = tankSpriteParts.hullSprite.calcPosition(point, sin, cos);
        let firstBottomChainPoint = tankSpriteParts.bottomTrackSprite.calcPosition(hullDefaultPoint, sin, cos);
        firstBottomChainPoint = this.calcPositionOfFirstChain(firstBottomChainPoint,
            this._trackWidth, this.chainWidth, sin, cos);

        return {firstTopChainPoint, firstBottomChainPoint};
    }
    public calcLastTopBottomChainPoints(tankSpriteParts: TankSpriteParts, point: Point, sin: number, cos: number):
        {lastTopChainPoint: Point, lastBottomChainPoint: Point} {

        const lastTopChainPoint = point;
        const hullDefaultPoint = tankSpriteParts.hullSprite.calcPosition(point, sin, cos);
        const lastBottomChainPoint = tankSpriteParts.bottomTrackSprite.calcPosition(hullDefaultPoint, sin, cos);

        return {lastTopChainPoint, lastBottomChainPoint};
    }
    public checkForRotateUpdate(hullAngle: number){
        return Math.abs(hullAngle - this._delayedHullAngle) >= TankTireTrackManager.UPDATE_ANGLE_DIFFERENCE;
    }
    private vanishFullTrack(){
        for (const node of this._listOfTirePairs){
            VanishingTireTracksManager.getVanishingListOfTirePairs().addToTail(this._listOfTirePairs.tail.value);
            this._listOfTirePairs.removeFromTail();
        }
    }
    public makeFullTireTrack(topPoint: Point, bottomPoint: Point, hullAngle: number, sin: number, cos: number){
        this._delayedHullAngle = hullAngle;

        this._topFirstChainPoint = topPoint.clone();
        this._bottomFirstChainPoint = bottomPoint.clone();

        this.vanishFullTrack();

        for (let i = 0; i < TankTireTrackManager.AMOUNT_OF_CHAINS; i++){
            const currTirePair = this.createNewTireTrackPair(topPoint, bottomPoint, hullAngle, sin, cos);
            this._listOfTirePairs.addToTail(currTirePair);

            if (i === TankTireTrackManager.AMOUNT_OF_CHAINS - 1){
                this._topLastChainPoint = topPoint.clone();
                this._bottomLastChainPoint = bottomPoint.clone();
            }

            this.moveToNextChain(topPoint, sin, cos);
            this.moveToNextChain(bottomPoint, sin, cos);
        }
    }
    public checkForForwardUpdate(topPoint: Point, bottomPoint: Point): boolean{
        return calcDistance(topPoint, this._topFirstChainPoint) >= this._chainWidth ||
            calcDistance(bottomPoint, this._bottomFirstChainPoint) >= this._chainWidth;
    }
    public forwardUpdate(topPoint: Point, bottomPoint: Point, hullAngle: number, sin: number, cos: number){
        this._delayedHullAngle = hullAngle;

        const currTirePair = this.createNewTireTrackPair(topPoint, bottomPoint, hullAngle, sin, cos);
        this._listOfTirePairs.addToHead(currTirePair);
        VanishingTireTracksManager.getVanishingListOfTirePairs().addToTail(this._listOfTirePairs.tail.value);
        this._listOfTirePairs.removeFromTail();

        this._topFirstChainPoint = topPoint;
        this._bottomFirstChainPoint = bottomPoint;

        const rotatedTopLastChainPoint: Point = new Point(this._listOfTirePairs.tail.value.topTire.sprite.x,
            this._listOfTirePairs.tail.value.topTire.sprite.y);
        const rotatedBottomLastChainPoint: Point = new Point(this._listOfTirePairs.tail.value.bottomTire.sprite.x,
            this._listOfTirePairs.tail.value.bottomTire.sprite.y);

        SpriteManipulator.rotateForPoint(this._listOfTirePairs.tail.value.topTire, rotatedTopLastChainPoint, -sin, cos);
        SpriteManipulator.rotateForPoint(this._listOfTirePairs.tail.value.bottomTire, rotatedBottomLastChainPoint, -sin, cos);

        this._topLastChainPoint = rotatedTopLastChainPoint;
        this._bottomLastChainPoint = rotatedBottomLastChainPoint;
    }
    public checkForBackwardUpdate(topPoint: Point, bottomPoint: Point): boolean{
        return calcDistance(topPoint, this._topLastChainPoint) >= this._chainWidth ||
            calcDistance(bottomPoint, this._bottomLastChainPoint) >= this._chainWidth;
    }
    public backwardUpdate(topPoint: Point, bottomPoint: Point, hullAngle: number, sin: number, cos: number){
        this._delayedHullAngle = hullAngle;

        const currTirePair = this.createNewTireTrackPair(topPoint, bottomPoint, hullAngle, sin, cos);
        this._listOfTirePairs.addToTail(currTirePair);
        VanishingTireTracksManager.getVanishingListOfTirePairs().addToTail(this._listOfTirePairs.head.value);
        this._listOfTirePairs.removeFromHead();

        this._topLastChainPoint = topPoint;
        this._bottomLastChainPoint = bottomPoint;

        const rotatedTopFirstChainPoint: Point = new Point(this._listOfTirePairs.head.value.topTire.sprite.x,
            this._listOfTirePairs.head.value.topTire.sprite.y);
        const rotatedBottomFirstChainPoint: Point = new Point(this._listOfTirePairs.head.value.bottomTire.sprite.x,
            this._listOfTirePairs.head.value.bottomTire.sprite.y);

        SpriteManipulator.rotateForPoint(this._listOfTirePairs.head.value.topTire, rotatedTopFirstChainPoint, -sin, cos);
        SpriteManipulator.rotateForPoint(this._listOfTirePairs.head.value.bottomTire, rotatedBottomFirstChainPoint, -sin, cos);

        this._topFirstChainPoint = rotatedTopFirstChainPoint;
        this._bottomFirstChainPoint = rotatedBottomFirstChainPoint;
    }
}