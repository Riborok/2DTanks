import {TankSpriteParts} from "./TankSpriteParts";
import {Point} from "../../geometry/Point";
import {Sprite} from "../Sprite";
import {TankTireTrack, TirePair} from "./TankTireTrack";
import {SpriteManipulator} from "../SpriteManipulator";
import {DoubleLinkedList} from "../../additionally/DoubleLinkedList";

export class TankSprite {
    private readonly _tankSpriteParts: TankSpriteParts;
    private _tankTireTrack: TankTireTrack;
    public constructor(tankSpriteParts: TankSpriteParts) {
        this._tankSpriteParts = tankSpriteParts;
    }
    public get tankSpriteParts(): TankSpriteParts { return this._tankSpriteParts }
    public spawnTireTracks(canvas: Element, point: Point, hullAngle: number, vanishingListOfTirePairs: DoubleLinkedList<TirePair>){
        this._tankTireTrack = new TankTireTrack(canvas, this._tankSpriteParts.topTrackSprite.width,
            this._tankSpriteParts.topTrackSprite.height, vanishingListOfTirePairs);

        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);

        const { firstTopChainPoint, firstBottomChainPoint } = this._tankTireTrack.calcFirstTopBottomChainPoints(
            this._tankSpriteParts, point, sin, cos
        );

        this._tankTireTrack.makeFullTireTrack(firstTopChainPoint, firstBottomChainPoint, hullAngle, sin, cos);
    }
    public updateForwardAction(point: Point, hullAngle: number, turretAngle: number) {
        this._tankSpriteParts.topTrackSprite.isForwardMovement = true;
        this._tankSpriteParts.bottomTrackSprite.isForwardMovement = true;
        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);
        const hullDefaultPoint = this._tankSpriteParts.hullSprite.calcPosition(point, sin, cos);
        this.updateSprite(point, hullAngle, turretAngle, sin, cos, hullDefaultPoint);

        let position = this._tankSpriteParts.topSpriteAccelerationEffect.calcPosition(hullDefaultPoint, sin, cos);
        TankSprite.updateSpritePart(this._tankSpriteParts.topSpriteAccelerationEffect, position, sin, cos, hullAngle);

        position = this._tankSpriteParts.bottomSpriteAccelerationEffect.calcPosition(hullDefaultPoint, sin, cos);
        TankSprite.updateSpritePart(this._tankSpriteParts.bottomSpriteAccelerationEffect, position, sin, cos, hullAngle);

        const { firstTopChainPoint, firstBottomChainPoint } = this._tankTireTrack.calcFirstTopBottomChainPoints(
            this._tankSpriteParts, point, sin, cos
        );

        if (this._tankTireTrack.checkForForwardUpdate(firstTopChainPoint, firstBottomChainPoint))
            this._tankTireTrack.forwardUpdate(firstTopChainPoint, firstBottomChainPoint, hullAngle, sin, cos);
    }
    public updateBackwardAction(point: Point, hullAngle: number, turretAngle: number) {
        this._tankSpriteParts.topTrackSprite.isForwardMovement = false;
        this._tankSpriteParts.bottomTrackSprite.isForwardMovement = false;

        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);

        this.defaultUpdate(point, hullAngle, turretAngle, sin, cos);

        const { lastTopChainPoint, lastBottomChainPoint } = this._tankTireTrack.calcLastTopBottomChainPoints(
            this._tankSpriteParts, point, sin, cos
        );

        if (this._tankTireTrack.checkForBackwardUpdate(lastTopChainPoint, lastBottomChainPoint))
            this._tankTireTrack.backwardUpdate(lastTopChainPoint, lastBottomChainPoint, hullAngle, sin, cos);
    }
    public updateRotateAction(point: Point, hullAngle: number, turretAngle: number){
        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);

        const { firstTopChainPoint, firstBottomChainPoint } = this._tankTireTrack.calcFirstTopBottomChainPoints(
            this._tankSpriteParts, point, sin, cos
        );

        if (this._tankTireTrack.checkForRotateUpdate(hullAngle))
            this._tankTireTrack.makeFullTireTrack(firstTopChainPoint, firstBottomChainPoint, hullAngle, sin, cos);

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
        SpriteManipulator.rotateForPoint(tankSpritePart, rotatedPoint, hullSin, hullCos);
        SpriteManipulator.setPosAndAngle(tankSpritePart, rotatedPoint, turretAngle);

        let position = this._tankSpriteParts.weaponSprite.calcPosition(turretDefPoint, turretSin, turretCos);
        TankSprite.updateSpritePart(this._tankSpriteParts.weaponSprite, position, turretSin, turretCos, turretAngle);
    }
    private updateSprite(point: Point, hullAngle: number, turretAngle: number, sin: number, cos: number,
                         hullDefaultPoint: Point) {
        let position = this._tankSpriteParts.topTrackSprite.calcPosition(point);
        TankSprite.updateSpritePart(this._tankSpriteParts.topTrackSprite, position, sin, cos, hullAngle);

        position = this._tankSpriteParts.hullSprite.calcPosition(point, sin, cos);
        TankSprite.updateSpritePart(this._tankSpriteParts.hullSprite, position, sin, cos, hullAngle);

        position = this._tankSpriteParts.bottomTrackSprite.calcPosition(hullDefaultPoint, sin, cos);
        TankSprite.updateSpritePart(this._tankSpriteParts.bottomTrackSprite, position, sin, cos, hullAngle)

        this.rotateTurretUpdate(hullDefaultPoint, turretAngle, sin, cos);
    }
    private static updateSpritePart(tankSpritePart: Sprite, position: Point, sin: number, cos: number, angle: number) {
        SpriteManipulator.rotateForPoint(tankSpritePart, position, sin, cos);
        SpriteManipulator.setPosAndAngle(tankSpritePart, position, angle);
    }
}