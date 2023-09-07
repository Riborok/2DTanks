import {TankSpriteParts} from "./TankSpriteParts";
import {Point} from "../../geometry/Point";
import {TankTireTrack, TirePair} from "./TankTireTrack";
import {SpriteManipulator} from "../SpriteManipulator";
import {DoubleLinkedList} from "../../additionally/DoubleLinkedList";
import {TankAcceleration} from "./TankAcceleration";

export class TankSprite {
    private readonly _tankSpriteParts: TankSpriteParts;
    private _tankTireTrack: TankTireTrack;
    private _tankAcceleration: TankAcceleration;
    public constructor(tankSpriteParts: TankSpriteParts) {
        this._tankSpriteParts = tankSpriteParts;
    }
    public get tankSpriteParts(): TankSpriteParts { return this._tankSpriteParts }
    public spawnTankAcceleration(canvas: Element, indentX: number, tankHeight: number) {
        this._tankAcceleration = new TankAcceleration(canvas, indentX, tankHeight);
    }
    public removeAcceleration() { this._tankAcceleration.removeAcceleration() }
    public spawnTireTracks(canvas: Element, point: Point, hullAngle: number, vanishingListOfTirePairs: DoubleLinkedList<TirePair>){
        this._tankTireTrack = new TankTireTrack(canvas, this._tankSpriteParts.topTrackSprite.width,
            this._tankSpriteParts.topTrackSprite.height, vanishingListOfTirePairs);

        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);

        const { topFirstChainPoint, bottomFirstChainPoint } = this._tankTireTrack.calcFirstTopBottomChainPoints(
            this._tankSpriteParts, point, sin, cos
        );

        this._tankTireTrack.makeFullTireTrack(topFirstChainPoint, bottomFirstChainPoint, hullAngle, sin, cos);
    }
    private updateTireTrack(point: Point, hullAngle: number, sin: number, cos: number){
        const { topFirstChainPoint, bottomFirstChainPoint } = this._tankTireTrack.calcFirstTopBottomChainPoints(
            this._tankSpriteParts, point, sin, cos);
        const { topLastChainPoint, bottomLastChainPoint } = this._tankTireTrack.calcLastTopBottomChainPoints(
            this._tankSpriteParts, point, sin, cos);

        const { isUpdate, prevPoint, currPoint } =
            this._tankTireTrack.checkForUpdate(topFirstChainPoint, bottomFirstChainPoint, topLastChainPoint, bottomLastChainPoint)
        if (isUpdate) {
            this._tankTireTrack.updateAllChainPoints(topFirstChainPoint, bottomFirstChainPoint, topLastChainPoint, bottomLastChainPoint);
            const direction = this._tankTireTrack.detectMovementDirection(prevPoint, currPoint, hullAngle);
            switch (direction){
                case 1:
                    this._tankTireTrack.forwardUpdate(topFirstChainPoint, bottomFirstChainPoint, hullAngle, sin, cos);
                    break;
                case 0:
                    this._tankTireTrack.makeFullTireTrack(topFirstChainPoint, bottomFirstChainPoint, hullAngle, sin, cos);
                    break;
                case -1:
                    this._tankTireTrack.backwardUpdate(topLastChainPoint, bottomLastChainPoint, hullAngle, sin, cos);
                    break;
            }
        }
    }
    public updateForwardAction(point: Point, hullAngle: number, turretAngle: number) {
        this._tankSpriteParts.topTrackSprite.isForwardMovement = true;
        this._tankSpriteParts.bottomTrackSprite.isForwardMovement = true;
        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);
        const hullDefaultPoint = this._tankSpriteParts.hullSprite.calcPosition(point, sin, cos);
        this.updateSprite(point, hullAngle, turretAngle, sin, cos, hullDefaultPoint);

        this._tankAcceleration.setPosition(hullDefaultPoint, sin, cos, hullAngle);

        this.updateTireTrack(point, hullAngle, sin, cos);
    }
    public updateBackwardAction(point: Point, hullAngle: number, turretAngle: number) {
        this._tankSpriteParts.topTrackSprite.isForwardMovement = false;
        this._tankSpriteParts.bottomTrackSprite.isForwardMovement = false;

        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);

        this.defaultUpdate(point, hullAngle, turretAngle, sin, cos);

        this.updateTireTrack(point, hullAngle, sin, cos);
    }
    public preUpdateAction(point: Point, hullAngle: number, turretAngle: number){
        const sin: number = Math.sin(hullAngle);
        const cos: number = Math.cos(hullAngle);
        this.updateTireTrack(point, hullAngle, sin, cos);

        this.defaultUpdate(point, hullAngle, turretAngle, sin, cos);
    }
    public updateAfterAction(point: Point, hullAngle: number, turretAngle: number) {
        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);
        this.defaultUpdate(point, hullAngle, turretAngle, sin, cos);
    }
    private defaultUpdate(point: Point, hullAngle: number, turretAngle: number, sin: number, cos: number) {
        const hullDefaultPoint = this._tankSpriteParts.hullSprite.calcPosition(point, sin, cos);
        this.updateSprite(point, hullAngle, turretAngle, sin, cos, hullDefaultPoint);
    }
    public rotateTurretUpdate(hullDefaultPoint: Point, turretAngle: number, hullSin: number, hullCos: number) {
        const turretSin = Math.sin(turretAngle);
        const turretCos = Math.cos(turretAngle);

        const tankSpritePart = this._tankSpriteParts.turretSprite;
        const rotatedPoint = tankSpritePart.calcPosition(hullDefaultPoint, hullSin, hullCos);
        const turretDefPoint = rotatedPoint.clone();
        SpriteManipulator.rotateForTurretPoint(tankSpritePart, turretDefPoint,
            hullSin, hullCos, turretSin, turretCos);
        SpriteManipulator.rotateToDefaultSpritePoint(tankSpritePart, rotatedPoint, hullSin, hullCos);
        SpriteManipulator.setPosAndAngle(tankSpritePart, rotatedPoint, turretAngle);

        let position = this._tankSpriteParts.weaponSprite.calcPosition(turretDefPoint, turretSin, turretCos);
        SpriteManipulator.updateSpritePart(this._tankSpriteParts.weaponSprite, position, turretSin, turretCos, turretAngle);
    }
    private updateSprite(point: Point, hullAngle: number, turretAngle: number, sin: number, cos: number,
                         hullDefaultPoint: Point) {
        let position = this._tankSpriteParts.topTrackSprite.calcPosition(point);
        SpriteManipulator.updateSpritePart(this._tankSpriteParts.topTrackSprite, position, sin, cos, hullAngle);

        position = this._tankSpriteParts.hullSprite.calcPosition(point, sin, cos);
        SpriteManipulator.updateSpritePart(this._tankSpriteParts.hullSprite, position, sin, cos, hullAngle);

        position = this._tankSpriteParts.bottomTrackSprite.calcPosition(hullDefaultPoint, sin, cos);
        SpriteManipulator.updateSpritePart(this._tankSpriteParts.bottomTrackSprite, position, sin, cos, hullAngle)

        this.rotateTurretUpdate(hullDefaultPoint, turretAngle, sin, cos);
    }
}