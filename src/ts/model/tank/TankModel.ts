import {TankParts} from "../../components/tank parts/TankParts";
import {BulletModel} from "../bullet/BulletModel";
import {BulletModelCreator} from "../bullet/BulletModelCreator";
import {IEntity} from "../../polygon/entity/IEntity";
import {LandModel} from "../Model";
import {Point, Vector} from "../../geometry/Point";
import {ANGLE_EPSILON} from "../../constants/gameConstants";
import {IArmor, MotionData} from "../../additionally/type";
import {PointRotator} from "../../geometry/PointRotator";
import {calcTurn, clampAngle, isAngleInQuadrant2or3} from "../../geometry/additionalFunc";
import {remapValueToRange} from "../../additionally/additionalFunc";
import {getTurretWidth} from "../../components/tank parts/ITurret";
import {getBarrelLength} from "../../components/tank parts/IWeapon";
import {LandForcesCalculator} from "../ForcesCalculator";

export class TankModel extends LandModel implements IArmor {
    private readonly _tankParts: TankParts;

    private _lastTimeShot: number = Date.now();
    private _bulletQuantity: number = 50;
    private _bulletNum: number = 0;
    private _isBraking: boolean = false;
    private _isDrift: boolean = false;
    private _armor: number;
    private _turretAngle: number;

    public get maxHealth(): number { return this._tankParts.hull.health }
    public get maxArmor(): number { return this._tankParts.hull.armor }

    public constructor(tankParts: TankParts, entity: IEntity) {
        super(entity, tankParts.hull.health);
        this._tankParts = tankParts;
        this._turretAngle = entity.angle;
        this._armor = tankParts.hull.armor;
    }
    public takeDamage(bullet: BulletModel) {
        this._armor -= bullet.armorPenetration;
        if (this._armor < 0) { this._armor = 0; }

        let damage = bullet.damage - this._armor * this.armorStrength;
        if (damage < 0) { damage = 0; }

        this._health -= damage;
    }
    public get turretAngle(): number { return this._turretAngle }
    public get armor() { return this._armor }
    public get armorStrength() { return this._tankParts.hull.armorStrength }
    public get bulletNum() { return this._bulletNum }
    public shot(): BulletModel | null {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._tankParts.weapon.reloadSpeed)
            return null;

        const bulletModel = BulletModelCreator.create(this._bulletNum, this.calcBulletExit(),
            this._turretAngle, this._tankParts.weapon);
        this._lastTimeShot = dateNow;
        this._bulletQuantity--;

        return bulletModel;
    }
    private calcBulletExit(): Point {
        const center = this._entity.calcCenter();
        const tankParts = this._tankParts;
        const muzzleLength = getTurretWidth(tankParts.turret) / 2 + getBarrelLength(tankParts.weapon);
        const x = center.x + muzzleLength * Math.cos(this._turretAngle);
        const y = center.y + muzzleLength * Math.sin(this._turretAngle);
        return new Point(x, y);
    }
    public incBulletQuantity(quantity: number) {
        this._bulletQuantity = Math.min(this._bulletQuantity + quantity, this._tankParts.turret.bulletCapacity);
    }
    public takeNewBullet(bulletNum: number) {
        this._bulletNum = bulletNum;
    }
    public turretClockwiseMovement(deltaTime: number) { this._turretAngle += this._tankParts.turret.angleSpeed * deltaTime }
    public turretCounterclockwiseMovement(deltaTime: number) { this._turretAngle -= this._tankParts.turret.angleSpeed * deltaTime }
    private incTurretAngle(deltaAngle: number) { this._turretAngle += deltaAngle }
    public hullClockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const angularData = this._tankParts.track.angularData;
        if (entity.angularVelocity < angularData.finishSpeed)
            entity.angularVelocity += LandForcesCalculator.calcAngularAcceleration(
                angularData.force, resistanceCoeff, airResistanceCoeff, deltaTime,
                entity.angularVelocity, entity.mass, entity.lengthwiseArea, entity.radiusLength);

        this.updateAngularVelocity();

        this.incTurretAngle(entity.angularVelocity);
    }
    public hullCounterclockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const angularData = this._tankParts.track.angularData;
        if (-entity.angularVelocity < angularData.finishSpeed)
            entity.angularVelocity -= LandForcesCalculator.calcAngularAcceleration(
                angularData.force, resistanceCoeff, airResistanceCoeff, deltaTime,
                entity.angularVelocity, entity.mass, entity.lengthwiseArea, entity.radiusLength);

        this.updateAngularVelocity();

        this.incTurretAngle(entity.angularVelocity);
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
    public forwardMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        this.movement(this._tankParts.track.forwardData, this._entity.angle,
            resistanceCoeff, airResistanceCoeff, deltaTime);
    }
    public backwardMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        this.movement(this._tankParts.track.backwardData,this._entity.angle + Math.PI,
            resistanceCoeff, airResistanceCoeff, deltaTime);
    }
    private static readonly VELOCITY_RECOVERY_COEFF: number = 0.017;
    private movement(data: MotionData, angle: number, resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const speed = entity.velocity.length;

        const velocityAngle = speed === 0 ? angle : entity.velocity.angle;
        const turn = calcTurn(angle, velocityAngle);

        this.setBrakingStatus(turn);

        if (TankModel.isStraightMovement(turn)) {
            this._isDrift = false;
            this.handleStraightMovement(data, resistanceCoeff, airResistanceCoeff, deltaTime, speed, velocityAngle);
        }
        else {
            this._isDrift = !TankModel.isReverseMovement(turn);
            if (this._isDrift) {
                this.determineDribbleSpeed(turn);
                this.applyTurn(this.calcShortestTurn(turn));
            }
            this.handleDriftMovement(data, resistanceCoeff, airResistanceCoeff, deltaTime, speed, turn, velocityAngle);
        }
    }
    private setBrakingStatus(turn: number) {
        this._isBraking = isAngleInQuadrant2or3(turn);
    }
    private calcShortestTurn(turn: number): number {
        if (this._isBraking)
            turn = TankModel.adjustTurnForBraking(turn);
        turn = TankModel.adjustTurnForRecovery(turn);
        return turn;
    }
    private static isStraightMovement(turn: number): boolean {
        return turn <= ANGLE_EPSILON || 2 * Math.PI - turn <= ANGLE_EPSILON;
    }
    private static isReverseMovement(turn: number): boolean {
        return Math.abs(turn - Math.PI) <= ANGLE_EPSILON;
    }
    private handleStraightMovement(data: MotionData, resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number,
                                   speed: number, velocityAngle: number) {
        if (speed < data.finishSpeed) {
            const acceleration = LandForcesCalculator.calcAcceleration(
                data.force, resistanceCoeff, airResistanceCoeff, deltaTime,
                speed, this._entity.mass, this._entity.lengthwiseArea);

            this._entity.velocity.addToCoordinates(acceleration * Math.cos(velocityAngle),
                acceleration * Math.sin(velocityAngle));
        }
    }
    private handleDriftMovement(data: MotionData, resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number,
                                speed: number, turn: number, velocityAngle: number) {
        if (this._isBraking || speed < data.finishSpeed) {
            const acceleration = LandForcesCalculator.calcAcceleration(
                data.force * Math.cos(turn), resistanceCoeff, airResistanceCoeff, deltaTime,
                speed, this._entity.mass, this._entity.lengthwiseArea);

            this.applyVelocityChange(acceleration, velocityAngle);
        }
    }
    private static adjustTurnForBraking(turn: number): number {
        return clampAngle(turn - Math.PI / 2);
    }
    private static adjustTurnForRecovery(turn: number): number {
        const oppositeTurn = turn - 2 * Math.PI;
        return (turn > Math.abs(oppositeTurn)) ? oppositeTurn : turn;
    }
    private applyTurn(turn: number) {
        turn *= TankModel.VELOCITY_RECOVERY_COEFF * this._entity.mass;
        PointRotator.rotatePoint(this._entity.velocity, Math.sin(turn), Math.cos(turn));
    }
    private determineDribbleSpeed(turn: number) {
        const scalar = remapValueToRange(Math.abs(Math.cos(turn)),
            0, 1, 0.95, 1)
        this._entity.velocity.scale(scalar);
    }
    public residualMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        const turn = calcTurn(this._entity.angle, this._entity.velocity.angle);
        if (this._isDrift || (!TankModel.isStraightMovement(turn) && !TankModel.isReverseMovement(turn))) {
            this._isDrift = true;
            this.determineDribbleSpeed(turn);
        }

        this._isBraking = false;
        super.residualMovement(resistanceCoeff, airResistanceCoeff, deltaTime);
    }
    public residualAngularMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        this.updateAngularVelocity();
        super.residualAngularMovement(resistanceCoeff, airResistanceCoeff, deltaTime);
        this.incTurretAngle(this._entity.angularVelocity);
    }
}