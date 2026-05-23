import { gameImg } from '../../constants/gameAssets';
import { Bonus, ResolutionManager } from '../../constants/gameConstants';
import { Point } from '../../geometry/Point';
import { IScalable, Sprite } from '../ISprite';

export class PickupItemSprite extends Sprite implements IScalable {
    private static readonly PHASE_SPEED = 0.0024;
    private static readonly PULSE_AMPLITUDE = 0.035;
    private static readonly BOB_AMPLITUDE_PX = 2;

    private readonly _basePoint: Point;
    private readonly _phaseSeed: number;
    private _animPhase: number;
    private _displayScale = 1;

    public constructor(basePoint: Point, imageSrc: string, size: number, phaseSeed = 0) {
        super(size, size, 6);
        this._basePoint = basePoint.clone();
        this._point = basePoint.clone();
        this._angle = 0;
        this._phaseSeed = phaseSeed;
        this._animPhase = phaseSeed;
        this._imgSprite.src = imageSrc;
    }

    public tickAnimation(deltaTimeMs: number): void {
        if (deltaTimeMs <= 0) {
            return;
        }
        this._animPhase += deltaTimeMs * PickupItemSprite.PHASE_SPEED;
        this.applyAnimationPhase();
    }

    public seekAnimation(elapsedTimeMs: number): void {
        this._animPhase = this._phaseSeed + Math.max(0, elapsedTimeMs) * PickupItemSprite.PHASE_SPEED;
        this.applyAnimationPhase();
    }

    private applyAnimationPhase(): void {
        this._displayScale = 1 + PickupItemSprite.PULSE_AMPLITUDE * Math.sin(this._animPhase);
        const bob = PickupItemSprite.BOB_AMPLITUDE_PX * Math.sin(this._animPhase * 1.28);
        this._point = new Point(this._basePoint.x, this._basePoint.y - bob);
    }

    public setBasePoint(point: Point): void {
        this._basePoint.x = point.x;
        this._basePoint.y = point.y;
    }

    public get scaleX(): number {
        return this._displayScale;
    }

    public get scaleY(): number {
        return this._displayScale;
    }
}

export function pickupItemImageSrc(type: number): string {
    switch (type) {
        case Bonus.key:
            return gameImg('item/Key.png');
        case Bonus.bulLight:
            return gameImg('item/Light_Bullet_Box.png');
        case Bonus.bulMedium:
            return gameImg('item/Medium_Bullet_Box.png');
        case Bonus.bulHeavy:
            return gameImg('item/Heavy_Bullet_Box.png');
        case Bonus.bulGrenade:
            return gameImg('item/Grenade_Bullet_Box.png');
        case Bonus.bulSniper:
            return gameImg('item/Sniper_Bullet_Box.png');
        case Bonus.perkShield:
            return gameImg('item/Perk_Shield.png');
        default:
            throw new Error(`Unsupported pickup item type: ${type}`);
    }
}

export function pickupItemSize(type: number): number {
    return type === Bonus.key ? ResolutionManager.KEY_SIZE : ResolutionManager.BOX_SIZE;
}

export function createPickupItemSprite(
    type: number,
    point: Point,
    itemId: number
): PickupItemSprite {
    const phaseSeed = (itemId % 628) * 0.01;
    return new PickupItemSprite(point, pickupItemImageSrc(type), pickupItemSize(type), phaseSeed);
}
