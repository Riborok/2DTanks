import {TankSpriteParts} from "./TankSpriteParts";
import {Point} from "../../geometry/Point";
import {directionMovement, TankTireTrack, TirePair} from "./tank effects/TankTireTrack";
import {SpriteManipulator} from "../SpriteManipulator";
import {IDoublyLinkedList} from "../../additionally/data structures/IDoublyLinkedList";
import {TankAcceleration} from "./tank effects/TankAcceleration";
import {TankTrackEffect} from "./tank effects/TankTrackEffect";
import {IStorage, MotionData} from "../../additionally/type";
import {rotDirection, TankDrift} from "./tank effects/TankDrift";
import {IAnimationManager} from "../../game/managers/animation managers/AnimationManager";
import {ISprite} from "../Sprite";

export class TankSprite {
    private readonly _tankSpriteParts: TankSpriteParts;
    private _tankTireTrack: TankTireTrack;
    private _tankAcceleration: TankAcceleration;
    private _tankDrift: TankDrift;
    private readonly _tankTrackEffect: TankTrackEffect;
    public constructor(tankSpriteParts: TankSpriteParts, forwardData: MotionData, backwardData: MotionData) {
        this._tankSpriteParts = tankSpriteParts;
        this._tankTrackEffect = new TankTrackEffect(forwardData, backwardData);
    }
    public get tankSpriteParts(): TankSpriteParts { return this._tankSpriteParts }
    public get tankTrackEffect(): TankTrackEffect { return this._tankTrackEffect }
    public get tankTireTrack(): TankTireTrack { return  this._tankTireTrack }
    public spawnTankAcceleration(storage: IStorage<ISprite>, indentX: number, tankHeight: number) {
        this._tankAcceleration = new TankAcceleration(storage, indentX, tankHeight);
    }
    public removeAcceleration() { this._tankAcceleration.removeAcceleration() }
    public spawnTireTracks(storage: IStorage<ISprite>, point: Point, hullAngle: number, vanishingListOfTirePairs: IDoublyLinkedList<TirePair>){
        this._tankTireTrack = new TankTireTrack(storage, this._tankSpriteParts.topTrackSprite, vanishingListOfTirePairs);

        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);

        const { topFirstChainPoint, bottomFirstChainPoint } = this._tankTireTrack.calcFirstTopBottomChainPoints(
            this._tankSpriteParts, point, sin, cos
        );

        this._tankTireTrack.spawnFullTireTrack(topFirstChainPoint, bottomFirstChainPoint, hullAngle, sin, cos);
    }
    public spawnDriftSmoke(animationManager: IAnimationManager){
        this._tankDrift = new TankDrift(animationManager,
            this._tankSpriteParts.topTrackSprite.width, this._tankSpriteParts.topTrackSprite.height)
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
                case directionMovement.dirForward:
                    this._tankTireTrack.forwardUpdate(topFirstChainPoint, bottomFirstChainPoint, hullAngle, sin, cos);
                    break;
                case directionMovement.dirRotate:
                    this._tankTireTrack.createTireTrackPair(topLastChainPoint, bottomLastChainPoint, hullAngle, sin, cos);
                    break;
                case directionMovement.dirBackward:
                    this._tankTireTrack.backwardUpdate(topLastChainPoint, bottomLastChainPoint, hullAngle, sin, cos);
                    break;
            }
        }
    }
    private updateDriftSmoke(topTrackPoint: Point, hullAngle: number, sin: number, cos: number){
        let bottomTrackPoint: Point = this._tankSpriteParts.hullSprite.calcPosition(topTrackPoint, sin, cos);
        bottomTrackPoint = this._tankSpriteParts.bottomTrackSprite.calcPosition(bottomTrackPoint, sin, cos);
        const rotateDirection: number = this._tankDrift.detectRotateDirection(hullAngle);
        switch (rotateDirection){
            case rotDirection.rotLeft:
                this._tankDrift.spawnTopSmoke(topTrackPoint, hullAngle, sin, cos);
                break;
            case rotDirection.rotRight:
                this._tankDrift.spawnBottomSmoke(bottomTrackPoint, hullAngle, sin, cos);
                break;
        }
    }
    public updateForwardAction(point: Point, hullAngle: number, turretAngle: number) {
        this._tankTrackEffect.isForwardMovement = true;
        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);
        const hullDefaultPoint = this._tankSpriteParts.hullSprite.calcPosition(point, sin, cos);
        this.updateSprite(point, hullAngle, turretAngle, sin, cos, hullDefaultPoint);

        this._tankAcceleration.setPosition(hullDefaultPoint, sin, cos, hullAngle);

        this.updateTireTrack(point, hullAngle, sin, cos);
        this.updateDriftSmoke(point, hullAngle, sin, cos);
    }
    public updateBackwardAction(point: Point, hullAngle: number, turretAngle: number) {
        this._tankTrackEffect.isForwardMovement = false;

        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);

        this.defaultUpdate(point, hullAngle, turretAngle, sin, cos);

        this.updateTireTrack(point, hullAngle, sin, cos);
        this.updateDriftSmoke(point, hullAngle, sin, cos);
    }
    public preUpdateAction(point: Point, hullAngle: number, turretAngle: number){
        const sin: number = Math.sin(hullAngle);
        const cos: number = Math.cos(hullAngle);
        this.updateTireTrack(point, hullAngle, sin, cos);
        this.updateDriftSmoke(point, hullAngle, sin, cos);

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

        const turretSprite = this._tankSpriteParts.turretSprite;
        const rotatedPoint = turretSprite.calcPosition(hullDefaultPoint, hullSin, hullCos);
        const turretDefPoint = rotatedPoint.clone();
        SpriteManipulator.rotateForTurretPoint(turretSprite, turretDefPoint,
            hullSin, hullCos, turretSin, turretCos);
        SpriteManipulator.rotateToDefaultSpritePoint(turretSprite, rotatedPoint, hullSin, hullCos);
        SpriteManipulator.setPosAndAngle(turretSprite, rotatedPoint, turretAngle);

        let position = this._tankSpriteParts.weaponSprite.calcPosition(turretDefPoint, turretSin, turretCos);
        SpriteManipulator.updateSpritePart(this._tankSpriteParts.weaponSprite, position, turretSin, turretCos, turretAngle);
    }
    private updateSprite(point: Point, hullAngle: number, turretAngle: number, sin: number, cos: number,
                         hullDefaultPoint: Point) {
        const topTrackSprite = this._tankSpriteParts.topTrackSprite;
        const bottomTrackSprite = this._tankSpriteParts.bottomTrackSprite;
        const hullSprite = this._tankSpriteParts.hullSprite;

        let position = topTrackSprite.calcPosition(point);
        SpriteManipulator.updateSpritePart(topTrackSprite, position, sin, cos, hullAngle);

        position = hullSprite.calcPosition(point, sin, cos);
        SpriteManipulator.updateSpritePart(hullSprite, position, sin, cos, hullAngle);

        position = bottomTrackSprite.calcPosition(hullDefaultPoint, sin, cos);
        SpriteManipulator.updateSpritePart(bottomTrackSprite, position, sin, cos, hullAngle)

        this.rotateTurretUpdate(hullDefaultPoint, turretAngle, sin, cos);
        this._tankTrackEffect.changeFrame(topTrackSprite, bottomTrackSprite);
    }
}