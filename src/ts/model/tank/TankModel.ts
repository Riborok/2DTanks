import {TankParts} from "./TankParts";
import {EntityManipulator} from "../entitiy/EntityManipulator";
import {BulletModel} from "../bullet/BulletModel";
import {BulletModelCreator} from "../bullet/BulletModelCreator";
import {IEntity} from "../entitiy/IEntity";
import {Model} from "../Model";
import {Point, Vector} from "../../geometry/Point";
import {EPSILON_RADIAN} from "../../constants/gameConstants";
import {MotionData} from "../../additionally/type";
import {PointRotator} from "../../geometry/PointRotator";
import {clampAngle} from "../../geometry/additionalFunc";
import {remapValueToRange} from "../../additionally/additionalFunc";

export class TankModel extends Model {
    private readonly _tankParts: TankParts;

    private _lastTimeShot: number;
    private _bulletQuantity: number = 0;
    private _bulletNum: number = 0;
    private _isBraking: boolean = false;
    private _isDrift: boolean = false;
    public constructor(tankParts: TankParts, entity: IEntity) {
        super(entity);
        this._tankParts = tankParts;
        this._lastTimeShot = Date.now();
    }
    public get tankParts(): TankParts { return this._tankParts }
    public get isDrift(): boolean { return this._isDrift }
    public shot(): BulletModel | null {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._tankParts.weapon.reloadSpeed)
            return null;

        const bulletModel = BulletModelCreator.create(this._bulletNum, this.calcBulletExit(),
            this._tankParts.turret.angle);
        bulletModel.bullet.launchFromWeapon(this._tankParts.weapon);
        this._lastTimeShot = dateNow;
        this._bulletQuantity--;

        return bulletModel;
    }
    private calcBulletExit(): Point {
        const center = this._entity.calcCenter();
        const muzzleLength = this._tankParts.turret.width / 2 + this._tankParts.weapon.barrelLength;
        const x = center.x + muzzleLength * Math.cos(this._tankParts.turret.angle);
        const y = center.y + muzzleLength * Math.sin(this._tankParts.turret.angle);
        return new Point(x, y);
    }
    public incBulletQuantity(quantity: number) {
        this._bulletQuantity = Math.min(this._bulletQuantity + quantity, this._tankParts.turret.bulletCapacity);
    }
    public takeNewBullet(bulletNum: number) {
        this._bulletNum = bulletNum;
    }
    public turretClockwiseMovement() {
        this._tankParts.turret.clockwiseMovement();
    }
    public turretCounterclockwiseMovement() {
        this._tankParts.turret.counterclockwiseMovement();
    }
    public hullClockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        const entity = this._entity;
        const angularData = this._tankParts.track.angularData;
        if (entity.angularVelocity < angularData.finishSpeed)
            entity.angularVelocity += this.calcAcceleration(angularData.force, resistanceCoeff,
                airResistanceCoeff, entity.angularVelocity) / entity.radiusLength;

        this.updateAngularVelocity();

        EntityManipulator.angularMovement(entity);
        this._tankParts.turret.incAngle(entity.angularVelocity);
    }
    public hullCounterclockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        const entity = this._entity;
        const angularData = this._tankParts.track.angularData;
        if (-entity.angularVelocity < angularData.finishSpeed)
            entity.angularVelocity -= this.calcAcceleration(angularData.force, resistanceCoeff,
                airResistanceCoeff, entity.angularVelocity) / entity.radiusLength;

        this.updateAngularVelocity();

        EntityManipulator.angularMovement(entity);
        this._tankParts.turret.incAngle(entity.angularVelocity);
    }
    private updateAngularVelocity() {
        if (this.isIdle())
            return;

        const entity = this._entity;
        const velocity = entity.velocity;

        if (this._isDrift || this._isBraking)
            this.incAngularVelocity(entity, velocity);

        if (!this._isBraking)
            this.decAngularVelocity(entity, velocity);
    }
    private incAngularVelocity(entity: IEntity, velocity: Vector) {
        const coeff = this.calcCoeff();
        const speedFactor = 1 + velocity.length / (this._tankParts.track.forwardData.finishSpeed * coeff);
        const massFactor = 1 + entity.mass / (coeff * 10);
        entity.angularVelocity *= massFactor * speedFactor;
    }
    private calcCoeff(): number {
        let coeff: number = 100;
        if (this._isDrift)
            coeff -= 25;
        if (this._isBraking)
            coeff -= 5;
        return coeff;
    }
    private decAngularVelocity(entity: IEntity, velocity: Vector) {
        const coeff: number = 20;
        const speedFactor = 1 - velocity.length / (this._tankParts.track.forwardData.finishSpeed * coeff);
        const massFactor = 1 - entity.mass / (coeff * 10);
        entity.angularVelocity *= massFactor * speedFactor;
        velocity.scale(massFactor);
    }
    public forwardMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        this.movement(this._tankParts.track.forwardData, this._entity.angle,
            resistanceCoeff, airResistanceCoeff);
    }
    public backwardMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        this.movement(this._tankParts.track.backwardData,this._entity.angle + Math.PI,
            resistanceCoeff, airResistanceCoeff);
    }
    private static readonly velocityRecoveryCoefficient: number = 0.01;
    private movement(data: MotionData, angle: number, resistanceCoeff: number, airResistanceCoeff: number) {
        const entity = this._entity;
        const speed = entity.velocity.length;

        const velocityAngle = speed === 0 ? angle : entity.velocity.angle;
        let turn = clampAngle(angle - velocityAngle);

        this.calcBrakingStatus(turn);

        const isReverseMovement = this.isReverseMovement(Math.abs(turn));
        if (this.isStraightMovement(Math.abs(turn))) {
            this._isDrift = false;
            this.handleStraightMovement(data, resistanceCoeff, airResistanceCoeff, speed, velocityAngle);
        }
        else {
            this._isDrift = !isReverseMovement;
            this.handleDriftMovement(data, resistanceCoeff, airResistanceCoeff, speed, turn, velocityAngle);
            if (this._isDrift)
                this.determineDribbleSpeed(turn);
        }

        if (!isReverseMovement) {
            if (this._isBraking) { turn = this.adjustTurnForBraking(turn); }
            this.applyTurn(this.adjustTurnForRecovery(turn));
        }
        EntityManipulator.movement(entity);
    }
    private calcBrakingStatus(turn: number) {
        this._isBraking = (turn > Math.PI / 2) && (turn < Math.PI * 3/2);
    }
    private isStraightMovement(deltaAngle: number): boolean {
        return deltaAngle <= EPSILON_RADIAN;
    }
    private isReverseMovement(deltaAngle: number): boolean {
        return Math.abs(deltaAngle - Math.PI) <= EPSILON_RADIAN;
    }
    private handleStraightMovement(data: MotionData, resistanceCoeff: number, airResistanceCoeff: number,
                                   speed: number, velocityAngle: number) {
        if (speed < data.finishSpeed) {
            const acceleration = this.calcAcceleration(data.force, resistanceCoeff, airResistanceCoeff, speed);
            this._entity.velocity.addToCoordinates(acceleration * Math.cos(velocityAngle),
                acceleration * Math.sin(velocityAngle));
        }
    }
    private handleDriftMovement(data: MotionData, resistanceCoeff: number, airResistanceCoeff: number,
                                speed: number, turn: number, velocityAngle: number) {
        if (this._isBraking || speed < data.finishSpeed) {
            const acceleration = this.calcAcceleration(data.force * Math.cos(turn),
                resistanceCoeff, airResistanceCoeff, speed);
            this.applyVelocityChange(acceleration, velocityAngle);
        }
    }
    private adjustTurnForBraking(turn: number): number {
        return clampAngle(turn - Math.PI / 2);
    }
    private adjustTurnForRecovery(turn: number): number {
        const oppositeTurn = turn - 2 * Math.PI;
        return (turn > Math.abs(oppositeTurn)) ? oppositeTurn : turn;
    }
    private applyTurn(turn: number) {
        turn *= TankModel.velocityRecoveryCoefficient;
        PointRotator.rotatePoint(this._entity.velocity, Math.sin(turn), Math.cos(turn));
    }
    private determineDribbleSpeed(turn: number) {
        const scalar = remapValueToRange(Math.abs(Math.cos(turn)),
            0, 1, 0.942, 1)
        this._entity.velocity.scale(scalar);
    }
    public residualMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        const turn = clampAngle(this._entity.angle - this._entity.velocity.angle);
        const deltaAngle = Math.abs(turn);
        if (this._isDrift || (!this.isStraightMovement(deltaAngle) && !this.isReverseMovement(deltaAngle))) {
            this._isDrift = true;
            this.determineDribbleSpeed(turn);
        }

        this._isBraking = false;
        super.residualMovement(resistanceCoeff, airResistanceCoeff);
    }
    public residualAngularMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        this.updateAngularVelocity();
        super.residualAngularMovement(resistanceCoeff, airResistanceCoeff);
        this._tankParts.turret.incAngle(this._entity.angularVelocity);
    }
}