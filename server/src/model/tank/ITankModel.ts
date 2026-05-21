import {TankParts} from "../../components/tank_parts/TankParts";
import {IBulletModel} from "../bullet/IBulletModel";
import {BulletModelCreator} from "../bullet/BulletModelCreator";
import {IEntity} from "../../polygon/entity/IEntity";
import {ILandModel, LandModel} from "../IModel";
import {Point, Vector} from "../../geometry/Point";
import {DEFAULT_BULLET_NUM as INITIAL_BULLET_NUM, PHYSICS_REFERENCE_DELTA_MS} from "../../constants/gameConstants";
import {IArmor, IBulletReceiver, IBulletShooter, ILandMovement, MotionData} from "../../utils/types";
import {PointRotator} from "../../geometry/PointRotator";
import {shortestAngleDelta} from "../../geometry/additionalFunc";
import {getTurretWidth} from "../../components/tank_parts/ITurret";
import {getBarrelLength} from "../../components/tank_parts/IWeapon";
import {LandForcesCalculator} from "../ForcesCalculator";
import {TRACK_SLIP_BY_MATERIAL} from "../../constants/gameConstants";

interface ITurretControl {
    get turretAngle(): number;
    turretClockwiseMovement(deltaTime: number): void;
    turretCounterclockwiseMovement(deltaTime: number): void;
}

/**
 * Выстрел принимает симуляционное время (GameWorld.elapsedMs), а не Date.now().
 * Иначе live и replay расходятся: в replay все тики строятся в tight-loop за миллисекунды,
 * reloadSpeed по часам всегда «ещё не остыл» — второй и последующие выстрелы гасятся.
 */
export interface ITankModel extends ILandModel, IArmor, ILandMovement, IBulletShooter, ITurretControl, IBulletReceiver {
    isShieldActive(simTimeMs: number): boolean;
    activateShield(simTimeMs: number, durationMs: number): void;
    /** Повернуть башню на тот же угол, на который за шаг повернулся корпус (ω·dt). */
    syncTurretAfterHullStep(deltaAngleRadians: number): void;
    /** Индекс материала уровня (0 трава, 1 грунт, 2 песчаник) — влияет на силу дрифта. */
    setMovementSurface(materialIndex: number): void;
    /**
     * После поворота корпуса без вращения скорости (инерция): ослабить боковую составляющую v в осях корпуса.
     * Сила гашения зависит от TRACK_SLIP_BY_MATERIAL (чем выше slip — тем больше остаётся бокового движения).
     */
    stabilizeVelocityAfterHullStep(deltaTime: number): void;
}

export class TankModel extends LandModel implements ITankModel {
    private static readonly DEFAULT_BULLET_NUM: number = INITIAL_BULLET_NUM;
    /**
     * Насколько быстро вектор скорости подтягивается к направлению корпуса (гусеницы тянут вдоль корпуса).
     * Умножается на (1 - k·slip); не путать со старым микроскопическим коэффициентом — там получался «лед».
     */
    /** Обычный ход: сильнее тяга скорости к корпусу = меньше дрифт */
    private static readonly TRACK_ALIGNMENT_STRENGTH: number = 0.178;
    private static readonly SLIP_ALIGNMENT_REDUCTION: number = 0.48;
    private static readonly MAX_VELOCITY_ALIGN_STEP: number = 0.2;
    /** Чем меньше — тем на ходу ближе скорость к корпусу (меньше занос по умолчанию) */
    private static readonly SPEED_DRIFT_RETENTION: number = 0.14;
    /** Торможение: во сколько раз слабее выравнивание (больше дрифта) */
    private static readonly BRAKING_ALIGNMENT_SCALE: number = 0.44;
    private static readonly BRAKING_ALIGN_CAP: number = 0.18;

    private readonly _tankParts: TankParts;
    private _surfaceMaterialIndex: number = 1;
    /**
     * Симуляционное время (мс) последнего выстрела. -Infinity — значит ни разу не стреляли,
     * любой первый выстрел проходит проверку reloadSpeed. Завязка на симуляционное время
     * (а не Date.now) обязательна для детерминизма live и replay.
     */
    private _lastTimeShot: number = -Infinity;
    private _bulletQuantity: number = 0;
    private _bulletNum: number = TankModel.DEFAULT_BULLET_NUM;
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
        this._lastTimeShot = -Infinity;
    }

    /** Без обнуления осей при смене знака — иначе рывки при торможении по диагонали. */
    protected applyVelocityChange(acceleration: number, angle: number) {
        this._entity.velocity.addToCoordinates(
            acceleration * Math.cos(angle),
            acceleration * Math.sin(angle));
        if (this._entity.velocity.length < 0.0008) {
            this._entity.velocity.x = 0;
            this._entity.velocity.y = 0;
        }
    }
    
    private _shieldUntilSimMs: number = -Infinity;

    public isShieldActive(simTimeMs: number): boolean {
        return simTimeMs < this._shieldUntilSimMs;
    }

    public activateShield(simTimeMs: number, durationMs: number): void {
        const until = simTimeMs + durationMs;
        this._shieldUntilSimMs = Math.max(this._shieldUntilSimMs, until);
    }

    public takeDamage(bullet: IBulletModel, simTimeMs?: number) {
        if (simTimeMs !== undefined && this.isShieldActive(simTimeMs)) {
            return;
        }
        this._armor -= bullet.armorPenetration;
        if (this._armor < 0) { this._armor = 0; }

        const damage = bullet.damage - this._armor * this.armorStrength;
        if (damage > 0) { this._health -= damage; }
    }
    
    public get turretAngle(): number { return this._turretAngle }
    public get armor(): number { return this._armor }
    public get armorStrength(): number { return this._tankParts.hull.armorStrength }
    public get bulletNum(): number { return this._bulletNum }
    
    /**
     * simTimeMs — симуляционное время (GameWorld.elapsedMs). Wall-clock (Date.now) ломает replay.
     */
    public shot(simTimeMs: number): IBulletModel | null {
        const reloadSpeed = this._tankParts.weapon.reloadSpeed;
        if (simTimeMs - this._lastTimeShot < reloadSpeed) {
            return null;
        }

        if (this._bulletQuantity === 0) { this._bulletNum = TankModel.DEFAULT_BULLET_NUM; }
        else { this._bulletQuantity--; }

        const bulletModel = BulletModelCreator.create(this._bulletNum, this.calcBulletExit(),
            this._turretAngle, this._tankParts.weapon);
        this._lastTimeShot = simTimeMs;

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
    
    public takeBullet(bulletNum: number) {
        this._bulletNum = bulletNum;
        this._bulletQuantity = this._tankParts.turret.bulletCapacity;
    }
    
    public turretClockwiseMovement(deltaTime: number) { 
        this._turretAngle += this._tankParts.turret.angleSpeed * deltaTime;
    }
    
    public turretCounterclockwiseMovement(deltaTime: number) { 
        this._turretAngle -= this._tankParts.turret.angleSpeed * deltaTime;
    }
    
    public syncTurretAfterHullStep(deltaAngleRadians: number) {
        this._turretAngle += deltaAngleRadians;
    }

    public setMovementSurface(materialIndex: number) {
        this._surfaceMaterialIndex = Math.max(0, Math.min(TRACK_SLIP_BY_MATERIAL.length - 1, materialIndex));
    }

    private getSurfaceSlip(): number {
        return TRACK_SLIP_BY_MATERIAL[this._surfaceMaterialIndex] ?? 0.1;
    }

    public stabilizeVelocityAfterHullStep(deltaTime: number): void {
        const v = this._entity.velocity;
        const speedSq = v.x * v.x + v.y * v.y;
        if (speedSq < 1e-10)
            return;
        const theta = this._entity.angle;
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const vPara = v.x * c + v.y * s;
        const vPerp = -v.x * s + v.y * c;
        if (Math.abs(vPerp) < 1e-8)
            return;

        const slip = this.getSurfaceSlip();
        const slipRef = 0.06;
        const slipNorm = Math.min(1, slip / slipRef);
        const dampPerRef = 0.035 + (1 - slipNorm) * 0.2;
        const scale = deltaTime / PHYSICS_REFERENCE_DELTA_MS;
        const factor = Math.max(0.38, 1 - dampPerRef * scale);
        const vPerpNew = vPerp * factor;
        v.x = vPara * c - vPerpNew * s;
        v.y = vPara * s + vPerpNew * c;
    }
    
    public clockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const angularData = this._tankParts.track.angularData;
        if (entity.angularVelocity < angularData.finishSpeed)
            entity.angularVelocity += LandForcesCalculator.calcAngularAcceleration(
                angularData.force, resistanceCoeff, airResistanceCoeff, deltaTime,
                entity.angularVelocity, entity.mass, entity.lengthwiseArea, entity.radiusLength);

        this.updateAngularVelocity();
    }
    
    public counterclockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const angularData = this._tankParts.track.angularData;
        if (-entity.angularVelocity < angularData.finishSpeed)
            entity.angularVelocity -= LandForcesCalculator.calcAngularAcceleration(
                angularData.force, resistanceCoeff, airResistanceCoeff, deltaTime,
                entity.angularVelocity, entity.mass, entity.lengthwiseArea, entity.radiusLength);

        this.updateAngularVelocity();
    }
    
    private updateAngularVelocity() {
        if (this.isIdle())
            return;

        const entity = this._entity;
        const velocity = entity.velocity;

        if (this._isDrift) {
            if (!this._isBraking)
                this.incAngularVelocity(entity, velocity);
            else
                this.incAngularVelocityBraking(entity, velocity);
        }

        this.decAngularVelocity(entity, velocity);
        this.clampAngularVelocity();
    }
    
    private incAngularVelocity(entity: IEntity, velocity: Vector) {
        const coeff = this.calcCoeff();
        const speedFactor = 1 + velocity.length / (this._tankParts.track.forwardData.finishSpeed * coeff);
        const massFactor = 1 + entity.mass / (coeff * 10);
        const slip = this.getSurfaceSlip();
        const raw = (speedFactor * massFactor - 1) * slip * 0.14;
        const boost = 1 + Math.min(0.016, Math.max(0, raw));
        entity.angularVelocity *= boost;
    }

    /** При торможении сильнее «разворот» ω в заносе */
    private incAngularVelocityBraking(entity: IEntity, velocity: Vector) {
        const coeff = this.calcCoeff();
        const speedFactor = 1 + velocity.length / (this._tankParts.track.forwardData.finishSpeed * coeff);
        const massFactor = 1 + entity.mass / (coeff * 10);
        const slip = this.getSurfaceSlip();
        const raw = (speedFactor * massFactor - 1) * (0.28 + slip * 0.22);
        const boost = 1 + Math.min(0.028, Math.max(0, raw));
        entity.angularVelocity *= boost;
    }

    private clampAngularVelocity() {
        const wFin = this._tankParts.track.angularData.finishSpeed;
        const lim = Math.max(0.038, wFin * 2.25);
        this._entity.angularVelocity = Math.max(-lim, Math.min(lim, this._entity.angularVelocity));
    }
    
    private calcCoeff(): number {
        let coeff: number = 100;
        if (this._isDrift)
            coeff -= Math.round(4 + 5 * this.getSurfaceSlip());
        if (this._isBraking)
            coeff -= 5;
        return coeff;
    }
    
    private decAngularVelocity(entity: IEntity, velocity: Vector) {
        const grip = 1 - this.getSurfaceSlip();
        let coeff: number = 30 + grip * 14;
        if (this._isBraking)
            coeff += 8;
        const speedFactor = 1 - velocity.length / (this._tankParts.track.forwardData.finishSpeed * coeff);
        const massFactor = 1 - entity.mass / (coeff * 10);
        let wDamp = massFactor * speedFactor;
        let vDamp = massFactor;
        if (this._isBraking) {
            wDamp = 0.7 * wDamp + 0.3;
            vDamp = 0.72 * vDamp + 0.28;
        }
        entity.angularVelocity *= wDamp;
        velocity.scale(vDamp);
    }
    
    public forwardMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        this.movement(this._tankParts.track.forwardData, this._entity.angle,
            resistanceCoeff, airResistanceCoeff, deltaTime);
    }
    
    public backwardMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        this.movement(this._tankParts.track.backwardData, this._entity.angle + Math.PI,
            resistanceCoeff, airResistanceCoeff, deltaTime);
    }
    
    /**
     * thrustAngle — направление тяги (вперёд: hull, назад: hull+π).
     * Торможение: тяга против скорости (скаляр по кратчайшему углу), без квадрантов и −π/2.
     */
    private movement(data: MotionData, thrustAngle: number, resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        // Заносы отключены: чистая тяга в направлении thrustAngle (вперёд/назад).
        this._isDrift = false;
        this._isBraking = false;
        const entity = this._entity;
        const speed = entity.velocity.length;
        const cosT = Math.cos(thrustAngle);
        const sinT = Math.sin(thrustAngle);
        /** Скорость вдоль направления тяги: < 0, если едем «против» тяги (напр. вперёд при нажатом назад). */
        const vAlong = speed > 1e-8 ? entity.velocity.x * cosT + entity.velocity.y * sinT : 0;

        const acceleration = LandForcesCalculator.calcAcceleration(
            data.force,
            resistanceCoeff,
            airResistanceCoeff,
            deltaTime,
            speed,
            entity.mass,
            entity.lengthwiseArea
        );

        /**
         * Если (тяга − трение) < 0, скаляр всё равно умножается на направление тяги — при vAlong < 0 это даёт
         * приращение скорости в сторону, противоположную тяге (для «назад» танк уезжает вперёд). На тяжёлой
         * сборке трение велико — баг заметен. Тормозим вдоль текущей скорости, пока не пересилим трение.
         */
        if (acceleration < 0 && vAlong < 0) {
            if (speed > 1e-8) {
                const brakeMag = Math.min(speed, (-acceleration) * 0.95);
                entity.velocity.addToCoordinates((-brakeMag / speed) * entity.velocity.x, (-brakeMag / speed) * entity.velocity.y);
                if (entity.velocity.length < 0.0008) {
                    entity.velocity.x = 0;
                    entity.velocity.y = 0;
                }
            }
            return;
        }

        if (speed < data.finishSpeed) {
            this.applyVelocityChange(acceleration, thrustAngle);
        }
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
    
    private applyDriftThrust(data: MotionData, resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number,
                             speed: number, velAngle: number, dThrustVel: number) {
        const thrustAlongVel = Math.cos(dThrustVel);
        const acceleration = LandForcesCalculator.calcAcceleration(
            data.force * thrustAlongVel, resistanceCoeff, airResistanceCoeff, deltaTime,
            speed, this._entity.mass, this._entity.lengthwiseArea);

        this.applyVelocityChange(acceleration, velAngle);
    }

    /** Подворот вектора скорости к целевому направлению тяги (вперёд/назад) по dTargetVel = target − vel. */
    private alignVelocityTowardTarget(dTargetVel: number) {
        const slip = this.getSurfaceSlip();
        const massNorm = Math.min(Math.max(this._entity.mass / 11, 0.88), 1.12);
        const finish = this._tankParts.track.forwardData.finishSpeed;
        const speed = this._entity.velocity.length;
        const speedRatio = Math.min(1, speed / (finish * 0.36 + 0.32));
        const speedRetention = 1 - TankModel.SPEED_DRIFT_RETENTION * speedRatio;
        let k = TankModel.TRACK_ALIGNMENT_STRENGTH
            * (1 - TankModel.SLIP_ALIGNMENT_REDUCTION * slip)
            * massNorm
            * speedRetention;
        if (this._isBraking)
            k *= TankModel.BRAKING_ALIGNMENT_SCALE;
        let step = dTargetVel * k;
        const cap = this._isBraking ? TankModel.BRAKING_ALIGN_CAP : TankModel.MAX_VELOCITY_ALIGN_STEP;
        if (step > cap)
            step = cap;
        else if (step < -cap)
            step = -cap;
        PointRotator.rotatePoint(this._entity.velocity, Math.sin(step), Math.cos(step));
    }

    private determineDribbleSpeedMild(dHullVel: number) {
        const slip = this.getSurfaceSlip();
        const minScale = 1 - 0.0026 * (0.35 + slip);
        const lat = Math.abs(Math.sin(dHullVel));
        const scalar = minScale + (1 - minScale) * (1 - lat);
        this._entity.velocity.scale(scalar);
    }

    private determineDribbleSpeedBraking(dHullVel: number) {
        const slip = this.getSurfaceSlip();
        const minScale = 1 - 0.008 * (0.5 + slip);
        const lat = Math.abs(Math.sin(dHullVel));
        const scalar = minScale + (1 - minScale) * (1 - lat);
        this._entity.velocity.scale(scalar);
    }
    
    public residualMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        this._isBraking = false;
        this._isDrift = false;
        super.residualMovement(resistanceCoeff, airResistanceCoeff, deltaTime);
    }
    
    public residualAngularMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        this.updateAngularVelocity();
        super.residualAngularMovement(resistanceCoeff, airResistanceCoeff, deltaTime);
    }
}
