import {Point} from "../../../geometry/Point";
import {TireTrackChainSprite} from "../../effects/TireTrackChainSprite";
import {DoublyLinkedList, IDoublyLinkedList} from "../../../additionally/data structures/IDoublyLinkedList";
import {SpriteManipulator} from "../../SpriteManipulator";
import {calcDistance, clampAngle} from "../../../geometry/additionalFunc";
import {TankSpriteParts} from "../TankSpriteParts";
import {TopTrackSprite} from "../tank parts/TrackSprite";
import {TireTracksManager} from "../../../game/managers/TireTracksManager";
import {TireTrackSprite} from "../../effects/TireTrackSprite";
import {Sprite} from "../../Sprite";

export type TirePair = { topTire: IVanishing, bottomTire: IVanishing }

export class TankTireTrack {
    private readonly _listOfTirePairs : IDoublyLinkedList<TirePair> = new DoublyLinkedList<TirePair>();
    private readonly _vanishingListOfTirePairs: IDoublyLinkedList<TirePair>;
    private readonly _canvas: Element;
    private readonly _trackWidth: number;
    private readonly _trackHeight: number;
    private readonly _trackType: number;
    private readonly _chainWidth: number;
    private readonly _chainHeight: number;
    private readonly _chainType: number;
    private _topFirstChainPoint: Point;
    private _bottomFirstChainPoint: Point;
    private _topLastChainPoint: Point;
    private _bottomLastChainPoint: Point;
    private static readonly DIRECTION_ANGLE_DIFFERENCE: number = 0.6;
    private static readonly AMOUNT_OF_CHAINS: number = 10;
    public get chainWidth () { return this._chainWidth }
    public constructor(canvas: Element, topTrackSprite: TopTrackSprite, vanishingListOfTirePairs: IDoublyLinkedList<TirePair>) {
        this._vanishingListOfTirePairs = vanishingListOfTirePairs;
        this._canvas = canvas;
        this._trackWidth = topTrackSprite.width;
        this._trackHeight = topTrackSprite.height;
        this._trackType = topTrackSprite.num;
        this._chainWidth = this.calcWidthOfChain();
        this._chainHeight = topTrackSprite.height;
        this._chainType = topTrackSprite.num % 2;
    }
    private calcWidthOfChain(): number{
        return this._trackWidth / TankTireTrack.AMOUNT_OF_CHAINS;
    }
    public static calcPositionOfFirstChain(point: Point, trackWidth: number, chainWidth: number,
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
    private vanishFullTrack(){
        for (const node of this._listOfTirePairs){
            this._vanishingListOfTirePairs.addToHead(this._listOfTirePairs.head);
            this._listOfTirePairs.removeFromHead();
        }
    }
    private static setAndPosTireTrackPair(tireTrackPair: {topTire: Sprite, bottomTire: Sprite},topPoint: Point, bottomPoint: Point, hullAngle: number, sin: number, cos: number){
        const rotatedTopPoint = topPoint.clone();
        const rotatedBottomPoint = bottomPoint.clone();

        SpriteManipulator.rotateToDefaultSpritePoint(tireTrackPair.topTire, rotatedTopPoint, sin, cos);
        SpriteManipulator.rotateToDefaultSpritePoint(tireTrackPair.bottomTire, rotatedBottomPoint, sin, cos);

        SpriteManipulator.setPosAndAngle(tireTrackPair.topTire, rotatedTopPoint, hullAngle);
        SpriteManipulator.setPosAndAngle(tireTrackPair.bottomTire, rotatedBottomPoint, hullAngle);
    }
    private createTireTrackChainPair(topPoint: Point, bottomPoint: Point, hullAngle: number, sin: number, cos: number): TirePair {
        const currTirePair = {
            topTire: new TireTrackChainSprite(this._chainWidth, this._chainHeight, this._chainType),
            bottomTire: new TireTrackChainSprite(this._chainWidth, this._chainHeight, this._chainType),
        }
        this._canvas.appendChild(currTirePair.topTire.sprite);
        this._canvas.appendChild(currTirePair.bottomTire.sprite);

        TankTireTrack.setAndPosTireTrackPair(currTirePair, topPoint, bottomPoint, hullAngle, sin, cos);

        return currTirePair;
    }
    public createTireTrackPair(topPoint: Point, bottomPoint: Point, hullAngle: number, sin: number, cos: number) {
        this.vanishFullTrack();

        const currTirePair = {
            topTire: new TireTrackSprite(this._trackWidth, this._trackHeight, this._trackType),
            bottomTire: new TireTrackSprite(this._trackWidth, this._trackHeight, this._trackType),
        }
        this._canvas.appendChild(currTirePair.topTire.sprite);
        this._canvas.appendChild(currTirePair.bottomTire.sprite);

        TankTireTrack.setAndPosTireTrackPair(currTirePair, topPoint, bottomPoint, hullAngle, sin, cos);

        this._listOfTirePairs.addToHead(currTirePair);
    }
    public calcFirstTopBottomChainPoints(tankSpriteParts: TankSpriteParts, point: Point, sin: number, cos: number):
        {topFirstChainPoint: Point, bottomFirstChainPoint: Point} {
        const firstTopChainPoint = TankTireTrack.calcPositionOfFirstChain(point,
            this._trackWidth, this.chainWidth, sin, cos);
        const hullDefaultPoint = tankSpriteParts.hullSprite.calcPosition(point, sin, cos);
        let firstBottomChainPoint = tankSpriteParts.bottomTrackSprite.calcPosition(hullDefaultPoint, sin, cos);
        firstBottomChainPoint = TankTireTrack.calcPositionOfFirstChain(firstBottomChainPoint,
            this._trackWidth, this.chainWidth, sin, cos);

        return {topFirstChainPoint: firstTopChainPoint, bottomFirstChainPoint: firstBottomChainPoint};
    }
    public calcLastTopBottomChainPoints(tankSpriteParts: TankSpriteParts, point: Point, sin: number, cos: number):
        {topLastChainPoint: Point, bottomLastChainPoint: Point} {

        const lastTopChainPoint = point.clone();
        const hullDefaultPoint = tankSpriteParts.hullSprite.calcPosition(point, sin, cos);
        const lastBottomChainPoint = tankSpriteParts.bottomTrackSprite.calcPosition(hullDefaultPoint, sin, cos);

        return {topLastChainPoint: lastTopChainPoint, bottomLastChainPoint: lastBottomChainPoint};
    }
    public spawnFullTireTrack(topPoint: Point, bottomPoint: Point, hullAngle: number, sin: number, cos: number){
        this._topFirstChainPoint = topPoint.clone();
        this._bottomFirstChainPoint = bottomPoint.clone();

        for (let i = 0; i < TankTireTrack.AMOUNT_OF_CHAINS; i++){
            const currTirePair = this.createTireTrackChainPair(topPoint, bottomPoint, hullAngle, sin, cos);
            this._listOfTirePairs.addToHead(currTirePair);

            if (i === TankTireTrack.AMOUNT_OF_CHAINS - 1){
                this._topLastChainPoint = topPoint.clone();
                this._bottomLastChainPoint = bottomPoint.clone();
            }

            this.moveToNextChain(topPoint, sin, cos);
            this.moveToNextChain(bottomPoint, sin, cos);
        }
    }
    public updateAllChainPoints(topFirstPoint: Point, bottomFirstPoint: Point,
                                topLastPoint: Point, bottomLastPoint: Point){
        this._topFirstChainPoint = topFirstPoint;
        this._bottomFirstChainPoint = bottomFirstPoint;
        this._topLastChainPoint = topLastPoint;
        this._bottomLastChainPoint = bottomLastPoint;
    }
    public checkForUpdate(topFirstPoint: Point, bottomFirstPoint: Point,
                          topLastPoint: Point, bottomLastPoint: Point): { isUpdate: boolean, prevPoint?: Point, currPoint?: Point } {
        const topFirstDistance = calcDistance(topFirstPoint, this._topFirstChainPoint);
        const bottomFirstDistance = calcDistance(bottomFirstPoint, this._bottomFirstChainPoint);
        const topLastDistance = calcDistance(topLastPoint, this._topLastChainPoint);
        const bottomLastDistance = calcDistance(bottomLastPoint, this._bottomLastChainPoint);
        if (topFirstDistance >= this._chainWidth)
            return {isUpdate: true, prevPoint: this._topFirstChainPoint, currPoint: topFirstPoint};
        else if (bottomFirstDistance >= this._chainWidth)
            return {isUpdate: true, prevPoint: this._bottomFirstChainPoint, currPoint: bottomFirstPoint};
        else if (topLastDistance >= this._chainWidth)
            return {isUpdate: true, prevPoint: this._topLastChainPoint, currPoint: topLastPoint};
        else if (bottomLastDistance >= this._chainWidth)
            return {isUpdate: true, prevPoint: this._bottomLastChainPoint, currPoint: bottomLastPoint};
        else
            return { isUpdate: false };
    }
    private getMovementAngle(firstPoint: Point, lastPoint: Point){
        const deltaX: number = lastPoint.x - firstPoint.x;
        const deltaY: number = lastPoint.y - firstPoint.y;

        return Math.atan2(deltaY, deltaX);
    }
    public detectMovementDirection(prevPoint: Point, newPoint: Point, hullAngle: number): number{
        const movementAngle = this.getMovementAngle(prevPoint, newPoint);
        let lowBorder = clampAngle(hullAngle - TankTireTrack.DIRECTION_ANGLE_DIFFERENCE,
            -Math.PI, Math.PI);
        let highBorder = clampAngle(hullAngle + TankTireTrack.DIRECTION_ANGLE_DIFFERENCE,
            -Math.PI, Math.PI);
        let isAngleFixed: boolean = false;
        if (lowBorder >= Math.PI / 2 && lowBorder <= Math.PI && highBorder >= -Math.PI && highBorder <= -Math.PI / 2){
            isAngleFixed = true;
            if (movementAngle >= 0) { highBorder = clampAngle(highBorder, 0, 2 * Math.PI) }
            else { lowBorder = clampAngle(lowBorder, -2 * Math.PI, 0) }
        }
        if (movementAngle >= lowBorder && movementAngle <= highBorder ||
            movementAngle <= lowBorder && movementAngle >= highBorder) { return 1 }
        else {
            if (isAngleFixed) {
                if (lowBorder < 0) {
                    lowBorder = clampAngle(lowBorder, 0, 2 * Math.PI);
                    highBorder = clampAngle(highBorder, 0, 2 * Math.PI);
                } else {
                    lowBorder = clampAngle(lowBorder, -2 * Math.PI, 0);
                    highBorder = clampAngle(highBorder, -2 * Math.PI, 0);
                }
            }
            const oppositeMovementAngle: number = clampAngle(movementAngle - Math.PI, -Math.PI, Math.PI);
            if (oppositeMovementAngle >= lowBorder && oppositeMovementAngle <= highBorder ||
                oppositeMovementAngle <= lowBorder && oppositeMovementAngle >= highBorder) { return -1 }
            else { return 0 }
        }
    }
    public forwardUpdate(topPoint: Point, bottomPoint: Point, hullAngle: number, sin: number, cos: number){
        const currTirePair = this.createTireTrackChainPair(topPoint, bottomPoint, hullAngle, sin, cos);
        this._listOfTirePairs.addToTail(currTirePair);

        if (this._listOfTirePairs.length > TankTireTrack.AMOUNT_OF_CHAINS) {
            this._vanishingListOfTirePairs.addToHead(this._listOfTirePairs.head);
            this._listOfTirePairs.removeFromHead();
        }
    }
    public backwardUpdate(topPoint: Point, bottomPoint: Point, hullAngle: number, sin: number, cos: number){
        const currTirePair = this.createTireTrackChainPair(topPoint, bottomPoint, hullAngle, sin, cos);
        this._listOfTirePairs.addToHead(currTirePair);

        if (this._listOfTirePairs.length > TankTireTrack.AMOUNT_OF_CHAINS) {
            this._vanishingListOfTirePairs.addToHead(this._listOfTirePairs.tail);
            this._listOfTirePairs.removeFromTail();
        }
    }
}