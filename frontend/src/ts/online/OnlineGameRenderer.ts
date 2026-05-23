import { Canvas } from '../game/processors/ICanvas';
import { DoublyLinkedList } from '../additionally/data structures/IDoublyLinkedList';
import { Size } from '../additionally/type';
import { GameWorldSnapshot } from './types';
import { Point } from '../geometry/Point';
import { TankSprite } from '../sprite/tank/TankSprite';
import { TankSpritePartsCreator } from '../sprite/tank/TankSpritePartsCreator';
import { TankPartsCreator } from '../components/tank parts/TankPartsCreator';
import { ResolutionManager, HEALTH_BAR_WIDTH_COEFF, HEALTH_BAR_HIGH_HP_COLOR, HEALTH_BAR_MEDIUM_HP_COLOR, HEALTH_BAR_LOW_HP_COLOR, ARMOR_BAR_COLOR, BULLET_ANIMATION_SIZE_INCREASE_COEFF } from '../constants/gameConstants';
import { BulletSprite } from '../sprite/bullet/BulletSprite';
import { WallSprite } from '../sprite/obstacles/WallSprite';
import { DestructibleCrateSprite } from '../sprite/obstacles/DestructibleCrateSprite';
import { ISprite } from '../sprite/ISprite';
import { createPickupItemSprite, PickupItemSprite } from '../sprite/collectable/PickupItemSprite';
import { BackgroundSprite } from '../sprite/background/BackgroundSprite';
import { SpriteManipulator } from '../sprite/SpriteManipulator';
import { DecorCreator } from '../game/creators/IDecorCreator';
import { AnimationManager } from '../game/managers/animation managers/AnimationManager';
import { Rectangle } from '../game/processors/shapes/IRectangle';
import { calcDistance, calcMidBetweenTwoPoint } from '../geometry/additionalFunc';
import { ServerTank, ServerExplosion, ServerGrenadeExplosion, ServerBulletImpact, ServerCrate } from './types';
import { tankVisualFromSnapshot } from './tankVisualFromSnapshot';
import { resolveReplayTankIdle } from './replayInterpolation';
import type { TirePair } from '../sprite/tank/tank effects/TankTireTrack';
import { TankExplosionAnimation } from '../sprite/animation/TankExplosionAnimation';
import { GrenadeExplosionAnimation } from '../sprite/animation/GrenadeExplosionAnimation';
import { BulletImpactAnimation } from '../sprite/animation/BulletImpactAnimation';
import { AnimationSprite } from '../sprite/animation/IAnimation';

interface RenderableTank {
    id: string;
    sprite: TankSprite;
    config: {
        hullNum: number;
        trackNum: number;
        turretNum: number;
        weaponNum: number;
        color: number;
    };
    lastPoint?: Point;
}

interface RenderableBullet {
    id: number;
    sprite: BulletSprite;
}

interface RenderableWall {
    id: number;
    sprite: WallSprite;
}

interface RenderableCrate {
    id: number;
    sprite: ISprite;
}

interface RenderableItem {
    id: number;
    sprite: ISprite;
}

type ReplayVisualEffect =
    | { key: string; kind: 'explosion'; startFrame: number; effect: ServerExplosion }
    | { key: string; kind: 'grenadeExplosion'; startFrame: number; effect: ServerGrenadeExplosion }
    | { key: string; kind: 'bulletImpact'; startFrame: number; effect: ServerBulletImpact };

export class OnlineGameRenderer {
    private canvas: Canvas;
    private animationManager: AnimationManager;
    /** Пары следов шин, которые плавно исчезают (как в офлайн-логике TankTireTrack). */
    private readonly vanishingTirePairs = new DoublyLinkedList<TirePair>();
    private static readonly TIRE_VANISH_OPACITY_PER_MS = 1 / 1800;
    private static readonly TIRE_VANISH_DURATION_MS = 1800;
    private static readonly TIRE_TRACK_TELEPORT_BREAK_PX = 150;
    /** В реплее: индекс кадра (дробный), с которого пара ушла в затухание. */
    private readonly replayVanishStartFrame = new Map<TirePair, number>();
    private readonly replayTaggedVanishPairs = new WeakSet<TirePair>();
    private replayPositionFrame = 0;
    private replayFrameMs = 1000 / 60;
    private replayEffectSource: { world: unknown }[] | null = null;
    private replayVisualEffectTimeline: ReplayVisualEffect[] = [];
    private readonly replayVisualAnimations = new Map<string, AnimationSprite>();
    private readonly replayItemStartFrames = new Map<number, number>();
    /** Данные танков для полос HP/брони каждый кадр (updateFromSnapshot обновляет). */
    private tanksDataForHealthBars: ServerTank[] = [];
    private tanks: Map<string, RenderableTank> = new Map();
    private bullets: Map<number, RenderableBullet> = new Map();
    private walls: Map<number, RenderableWall> = new Map();
    private crates: Map<number, RenderableCrate> = new Map();
    private items: Map<number, RenderableItem> = new Map();
    private backgroundMaterial: number | undefined = undefined; // Track current background material
    private currentLevel: number = 1;
    private tankConfigs: Map<string, {
        hullNum: number;
        trackNum: number;
        turretNum: number;
        weaponNum: number;
        color: number;
    }> = new Map();
    private playerLabels: Map<string, string> = new Map();
    /**
     * Сервер держит эффекты в снимке несколько тиков подряд — иначе они теряются в батче update().
     * Без дедупа клиент запускал бы одну и ту же анимацию по разу на каждый повтор снимка.
     */
    private recentOneShotEffectKeys = new Set<string>();
    private static readonly ONE_SHOT_EFFECT_KEYS_CAP = 2048;
    private isReversing: boolean = false;

    private wasReversing: boolean = false;

    /**
     * В реплее следы строятся только по дискретным ключевым кадрам (syncReplayTireTracksToKeyframe),
     * а не на каждом кадре интерполяции — иначе результат зависит от скорости воспроизведения.
     */
    private replayMode = false;

    public setReplayMode(enabled: boolean): void {
        this.replayMode = enabled;
        if (!enabled) {
            this.replayVanishStartFrame.clear();
        }
    }

    /** Позиция воспроизведения реплея (дробный индекс кадра) для детерминированного затухания следов. */
    public setReplayPlaybackClock(positionFrame: number, frameMs: number): void {
        this.replayPositionFrame = positionFrame;
        if (frameMs > 0) {
            this.replayFrameMs = frameMs;
        }
    }

    private clearReplayVisualAnimations(): void {
        for (const animation of this.replayVisualAnimations.values()) {
            this.canvas.removeById(animation);
        }
        this.replayVisualAnimations.clear();
    }

    private rebuildReplayVisualEffectTimeline(frames: { world: unknown }[]): void {
        const timeline: ReplayVisualEffect[] = [];
        this.replayItemStartFrames.clear();
        let previousExplosionKeys = new Set<string>();
        let previousGrenadeKeys = new Set<string>();
        let previousImpactKeys = new Set<string>();

        for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
            const world = frames[frameIndex].world as GameWorldSnapshot;
            const explosionKeys = new Set<string>();
            const grenadeKeys = new Set<string>();
            const impactKeys = new Set<string>();

            for (const item of world.items ?? []) {
                if (!this.replayItemStartFrames.has(item.id)) {
                    this.replayItemStartFrames.set(item.id, frameIndex);
                }
            }

            for (const effect of world.explosions ?? []) {
                const baseKey = `exp|${Math.round(effect.x)}|${Math.round(effect.y)}|${Number(effect.angle || 0).toFixed(4)}`;
                explosionKeys.add(baseKey);
                if (!previousExplosionKeys.has(baseKey)) {
                    timeline.push({ key: `${baseKey}|${frameIndex}`, kind: 'explosion', startFrame: frameIndex, effect });
                }
            }
            for (const effect of world.grenadeExplosions ?? []) {
                const baseKey =
                    `gren|${Math.round(effect.x)}|${Math.round(effect.y)}|` +
                    `${Number(effect.angle || 0).toFixed(4)}|${Math.round(effect.size ?? 0)}`;
                grenadeKeys.add(baseKey);
                if (!previousGrenadeKeys.has(baseKey)) {
                    timeline.push({
                        key: `${baseKey}|${frameIndex}`,
                        kind: 'grenadeExplosion',
                        startFrame: frameIndex,
                        effect
                    });
                }
            }
            for (const effect of world.bulletImpacts ?? []) {
                const baseKey =
                    `imp|${Math.round(effect.x)}|${Math.round(effect.y)}|` +
                    `${Number(effect.angle).toFixed(4)}|${effect.bulletType}`;
                impactKeys.add(baseKey);
                if (!previousImpactKeys.has(baseKey)) {
                    timeline.push({ key: `${baseKey}|${frameIndex}`, kind: 'bulletImpact', startFrame: frameIndex, effect });
                }
            }

            previousExplosionKeys = explosionKeys;
            previousGrenadeKeys = grenadeKeys;
            previousImpactKeys = impactKeys;
        }

        this.replayEffectSource = frames;
        this.replayVisualEffectTimeline = timeline;
        this.clearReplayVisualAnimations();
    }

    private replayVisualEffectDurationMs(effect: ReplayVisualEffect): number {
        if (effect.kind === 'explosion') {
            return 9 * 90;
        }
        if (effect.kind === 'grenadeExplosion') {
            return 10 * 50;
        }
        return 4 * 70;
    }

    private createReplayVisualAnimation(effect: ReplayVisualEffect): AnimationSprite {
        if (effect.kind === 'explosion') {
            const point = new Point(
                ResolutionManager.worldToCanvasX(effect.effect.x),
                ResolutionManager.worldToCanvasY(effect.effect.y)
            );
            return new TankExplosionAnimation(point, effect.effect.angle || 0);
        }
        if (effect.kind === 'grenadeExplosion') {
            const point = new Point(
                ResolutionManager.worldToCanvasX(effect.effect.x),
                ResolutionManager.worldToCanvasY(effect.effect.y)
            );
            const size = ResolutionManager.scaleWorldLength(effect.effect.size);
            return new GrenadeExplosionAnimation(point, effect.effect.angle || 0, size);
        }
        const bulletType = Math.min(Math.max(effect.effect.bulletType, 0), ResolutionManager.BULLET_WIDTH.length - 1);
        const width = ResolutionManager.BULLET_WIDTH[bulletType] * BULLET_ANIMATION_SIZE_INCREASE_COEFF;
        const height = ResolutionManager.BULLET_HEIGHT[bulletType] * BULLET_ANIMATION_SIZE_INCREASE_COEFF;
        const point = new Point(
            ResolutionManager.worldToCanvasX(effect.effect.x),
            ResolutionManager.worldToCanvasY(effect.effect.y)
        );
        return new BulletImpactAnimation(point, effect.effect.angle, width, height, effect.effect.bulletType === 0 ? 0 : 1);
    }

    public syncReplayVisualEffects(frames: { world: unknown }[], positionFrame: number, frameMs: number): void {
        if (frames !== this.replayEffectSource) {
            this.rebuildReplayVisualEffectTimeline(frames);
        }
        const activeKeys = new Set<string>();
        const maxLifetimeMs = 9 * 90;
        let low = 0;
        let high = this.replayVisualEffectTimeline.length - 1;
        let lastStartedIndex = -1;
        while (low <= high) {
            const middle = Math.floor((low + high) / 2);
            if (this.replayVisualEffectTimeline[middle].startFrame <= positionFrame) {
                lastStartedIndex = middle;
                low = middle + 1;
            } else {
                high = middle - 1;
            }
        }
        for (let index = lastStartedIndex; index >= 0; index--) {
            const effect = this.replayVisualEffectTimeline[index];
            const elapsedMs = (positionFrame - effect.startFrame) * frameMs;
            if (elapsedMs >= maxLifetimeMs) {
                break;
            }
            if (elapsedMs >= this.replayVisualEffectDurationMs(effect)) {
                continue;
            }
            activeKeys.add(effect.key);
            let animation = this.replayVisualAnimations.get(effect.key);
            if (!animation) {
                animation = this.createReplayVisualAnimation(effect);
                this.replayVisualAnimations.set(effect.key, animation);
                this.canvas.insert(animation);
            }
            animation.seekToElapsedMs(elapsedMs);
        }
        for (const [key, animation] of this.replayVisualAnimations) {
            if (!activeKeys.has(key)) {
                this.canvas.removeById(animation);
                this.replayVisualAnimations.delete(key);
            }
        }
    }

    public setReversing(val: boolean): void {
        this.isReversing = val;
    }

    private clearAllTireTracks(): void {
        for (const tank of this.tanks.values()) {
            tank.sprite.vanishTireTracks();
        }
        const lingering = [...this.vanishingTirePairs];
        for (const pair of lingering) {
            this.canvas.removeById(pair.topTire as unknown as ISprite);
            this.canvas.removeById(pair.bottomTire as unknown as ISprite);
        }
        this.vanishingTirePairs.clear();
        this.replayVanishStartFrame.clear();
    }

    private tagVanishingPairsForKeyframe(keyframe: number): void {
        for (const pair of this.vanishingTirePairs) {
            if (!this.replayTaggedVanishPairs.has(pair)) {
                this.replayTaggedVanishPairs.add(pair);
                this.replayVanishStartFrame.set(pair, keyframe);
            }
        }
    }

    private tankCenterFromServer(tank: ServerTank): Point {
        return new Point(
            ResolutionManager.worldToCanvasX(tank.x),
            ResolutionManager.worldToCanvasY(tank.y)
        );
    }

    private isTireTrackTeleport(fromPoint: Point, toPoint: Point): boolean {
        return Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y) >
            OnlineGameRenderer.TIRE_TRACK_TELEPORT_BREAK_PX;
    }

    private ensureRenderableTank(serverTank: ServerTank): RenderableTank {
        let renderableTank = this.tanks.get(serverTank.id);
        const config = tankVisualFromSnapshot(serverTank, this.tankConfigs.get(serverTank.id));
        if (!renderableTank) {
            const tankParts = TankPartsCreator.create(
                config.hullNum,
                config.trackNum,
                config.turretNum,
                config.weaponNum
            );
            const spriteParts = TankSpritePartsCreator.create(
                config.color,
                config.hullNum,
                config.trackNum,
                config.turretNum,
                config.weaponNum
            );
            const sprite = new TankSprite(spriteParts, tankParts.track.forwardData, tankParts.track.backwardData);
            sprite.spawnDriftSmoke(this.animationManager);
            renderableTank = { id: serverTank.id, sprite, config };
            this.tanks.set(serverTank.id, renderableTank);
            const parts = sprite.tankSpriteParts;
            this.canvas.insert(parts.topTrackSprite);
            this.canvas.insert(parts.bottomTrackSprite);
            this.canvas.insert(parts.hullSprite);
            this.canvas.insert(parts.turretSprite);
            this.canvas.insert(parts.weaponSprite);
        }
        return renderableTank;
    }

    private applyReplayTireSegment(
        renderableTank: RenderableTank,
        from: ServerTank,
        to: ServerTank
    ): void {
        const fromPoint = this.tankCenterFromServer(from);
        const toPoint = this.tankCenterFromServer(to);
        if (this.isTireTrackTeleport(fromPoint, toPoint)) {
            renderableTank.sprite.vanishTireTracks();
            renderableTank.sprite.spawnTireTracks(this.canvas, toPoint, to.angle, this.vanishingTirePairs);
            renderableTank.sprite.updateAfterAction(toPoint, to.angle, to.turretAngle, true, false, true);
            renderableTank.lastPoint = toPoint;
            return;
        }
        const chainWidth = renderableTank.sprite.tankTireTrack?.chainWidth ?? 8;
        const dist = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
        const steps = Math.max(1, Math.ceil(dist / Math.max(1, chainWidth * 0.85)));
        const isIdle = resolveReplayTankIdle(from, to);

        for (let step = 1; step <= steps; step++) {
            const t = step / steps;
            const x = fromPoint.x + (toPoint.x - fromPoint.x) * t;
            const y = fromPoint.y + (toPoint.y - fromPoint.y) * t;
            let angle = to.angle;
            if (step < steps) {
                let delta = to.angle - from.angle;
                while (delta > Math.PI) delta -= 2 * Math.PI;
                while (delta < -Math.PI) delta += 2 * Math.PI;
                angle = from.angle + delta * t;
            }
            const point = new Point(x, y);
            renderableTank.sprite.applyTireTrackStep(point, angle);
            if (step === steps) {
                renderableTank.sprite.updateAfterAction(point, angle, to.turretAngle, isIdle, false, true);
                renderableTank.lastPoint = point;
            }
        }
    }

    private applyReplayKeyframeTireStep(prevWorld: GameWorldSnapshot, nextWorld: GameWorldSnapshot): void {
        const prevTanks = prevWorld.tanks ?? [];
        const nextTanks = nextWorld.tanks ?? [];
        const prevById = new Map(prevTanks.map((t) => [t.id, t]));

        for (const nextTank of nextTanks) {
            const renderableTank = this.ensureRenderableTank(nextTank);
            const prevTank = prevById.get(nextTank.id);
            const nextPoint = this.tankCenterFromServer(nextTank);

            if (!prevTank) {
                renderableTank.sprite.spawnTireTracks(
                    this.canvas,
                    nextPoint,
                    nextTank.angle,
                    this.vanishingTirePairs
                );
                renderableTank.lastPoint = nextPoint;
                continue;
            }

            if (!renderableTank.sprite.tankTireTrack) {
                renderableTank.sprite.spawnTireTracks(
                    this.canvas,
                    this.tankCenterFromServer(prevTank),
                    prevTank.angle,
                    this.vanishingTirePairs
                );
            }

            this.applyReplayTireSegment(renderableTank, prevTank, nextTank);
        }
    }

    /**
     * Синхронизирует следы шин с ключевым кадром реплея (индекс в массиве frames).
     * Не зависит от скорости воспроизведения и интерполяции между кадрами.
     */
    public syncReplayTireTracksToKeyframe(
        frames: { world: unknown }[],
        targetIdx: number,
        prevSyncedIdx: number
    ): void {
        if (frames.length === 0 || targetIdx < 0) {
            return;
        }
        const clampedTarget = Math.min(targetIdx, frames.length - 1);

        if (prevSyncedIdx < 0 || clampedTarget < prevSyncedIdx) {
            this.clearAllTireTracks();
            const firstWorld = frames[0].world as GameWorldSnapshot;
            this.updateFromSnapshot(firstWorld);
            for (const tank of firstWorld.tanks ?? []) {
                const renderableTank = this.ensureRenderableTank(tank);
                const point = this.tankCenterFromServer(tank);
                renderableTank.sprite.spawnTireTracks(this.canvas, point, tank.angle, this.vanishingTirePairs);
                renderableTank.lastPoint = point;
            }
            for (let i = 1; i <= clampedTarget; i++) {
                this.applyReplayKeyframeTireStep(
                    frames[i - 1].world as GameWorldSnapshot,
                    frames[i].world as GameWorldSnapshot
                );
                this.tagVanishingPairsForKeyframe(i);
            }
            this.applyReplayTireEvaporation(this.replayPositionFrame);
            return;
        }

        if (clampedTarget === prevSyncedIdx) {
            return;
        }

        for (let i = prevSyncedIdx + 1; i <= clampedTarget; i++) {
            this.applyReplayKeyframeTireStep(
                frames[i - 1].world as GameWorldSnapshot,
                frames[i].world as GameWorldSnapshot
            );
            this.tagVanishingPairsForKeyframe(i);
        }
        this.applyReplayTireEvaporation(this.replayPositionFrame);
    }

    public resetOneShotEffectsState(): void {
        this.recentOneShotEffectKeys.clear();
    }

    constructor(ctx: CanvasRenderingContext2D, size: Size) {
        this.canvas = new Canvas(ctx, size);
        this.animationManager = new AnimationManager(this.canvas);
    }

    public setTankConfig(tankId: string, config: {
        hullNum: number;
        trackNum: number;
        turretNum: number;
        weaponNum: number;
        color: number;
    }): void {
        this.tankConfigs.set(tankId, config);
    }

    public setPlayerLabels(labels: Map<string, string>): void {
        this.playerLabels = new Map(labels);
    }

    private setupBackground(materialNum: number = 1): void {
        // Only recreate background if material changed
        if (this.backgroundMaterial === materialNum) {
            return;
        }
        
        // Clear all existing background sprites (zIndex 0)
        const canvasAny = this.canvas as any;
        if (canvasAny._sprites && canvasAny._sprites[0]) {
            const backgroundSprites = Array.from(canvasAny._sprites[0].values()) as ISprite[];
            for (const sprite of backgroundSprites) {
                this.canvas.removeById(sprite);
            }
        }
        
        // Фон только в области игры 1920×1080 (с учётом letterbox)
        const gw = Math.ceil(ResolutionManager.getGameViewportWidthPx());
        const gh = Math.ceil(ResolutionManager.getGameViewportHeightPx());
        const origin = new Point(
            Math.floor(ResolutionManager.getOffsetX()),
            Math.floor(ResolutionManager.getOffsetY())
        );
        const size = { width: gw, height: gh };

        if (gw > 0 && gh > 0) {
            console.log('[CLIENT] Setting up background, materialNum:', materialNum, 'game viewport:', size, 'origin:', origin);
            DecorCreator.fullFillBackground(materialNum, size, this.canvas, origin);
            
            // Verify background sprites were created
            if (canvasAny._sprites && canvasAny._sprites[0]) {
                const createdSprites = Array.from(canvasAny._sprites[0].values()) as ISprite[];
                console.log('[CLIENT] Created', createdSprites.length, 'background sprites');
                if (createdSprites.length > 0) {
                    const firstSprite = createdSprites[0];
                    console.log('[CLIENT] First background sprite imgSrc:', firstSprite.imgSprite.src, 'complete:', firstSprite.imgSprite.complete);
                }
            }
            
            this.backgroundMaterial = materialNum;
        } else {
            console.warn('[CLIENT] Canvas size is invalid, skipping background setup:', size);
        }
    }

    public updateFromSnapshot(snapshot: GameWorldSnapshot): void {
        if (this.isReversing) {
            this.recentOneShotEffectKeys.clear();
        }

        const snapLevel =
            typeof snapshot.currentLevel === 'number' && Number.isFinite(snapshot.currentLevel)
                ? Math.max(1, Math.min(3, Math.floor(snapshot.currentLevel)))
                : 1;
        /** Сравнение до смены this.currentLevel — иначе блок стен никогда не срабатывал. */
        const levelChangedForWalls = snapLevel !== this.currentLevel;
        const snapshotBackgroundMaterial = Number(snapshot.backgroundMaterial);
        const materialNum = Number.isFinite(snapshotBackgroundMaterial)
            ? Math.max(0, Math.min(2, Math.floor(snapshotBackgroundMaterial)))
            : snapLevel === 3
              ? 0
              : snapLevel - 1;
        const backgroundChanged = this.backgroundMaterial !== materialNum;

        if (levelChangedForWalls || backgroundChanged) {
            this.setupBackground(materialNum);
            this.currentLevel = snapLevel;
            this.recentOneShotEffectKeys.clear();
        }

        this.updateTanks(snapshot.tanks ?? []);

        this.updateBullets(snapshot.bullets ?? []);

        if (levelChangedForWalls) {
            for (const [, wall] of this.walls.entries()) {
                this.canvas.removeById(wall.sprite);
            }
            this.walls.clear();
        }
        const walls = snapshot.walls ?? [];
        if (walls.length > 0) {
            this.updateWalls(walls);
        }
        this.updateCrates((snapshot.crates ?? []) as ServerCrate[]);

        this.updateItems(snapshot.items ?? []);
        
        // Replay effects are reconstructed from the playback clock so seeks retain their exact animation frame.
        if (!this.replayMode && snapshot.explosions && snapshot.explosions.length > 0) {
            this.handleExplosions(snapshot.explosions);
        }
        
        // Handle grenade explosions
        if (!this.replayMode && snapshot.grenadeExplosions && snapshot.grenadeExplosions.length > 0) {
            this.handleGrenadeExplosions(snapshot.grenadeExplosions);
        }

        if (!this.replayMode && snapshot.bulletImpacts && snapshot.bulletImpacts.length > 0) {
            this.handleBulletImpacts(snapshot.bulletImpacts);
        }
    }

    private updateTanks(serverTanks: any[]): void {
        const currentTankIds = new Set(serverTanks.map(t => t.id));
        
        // Remove tanks that no longer exist
        for (const [id, tank] of this.tanks.entries()) {
            if (!currentTankIds.has(id)) {
                tank.sprite.vanishTireTracks();
                const parts = tank.sprite.tankSpriteParts;
                this.canvas.removeById(parts.topTrackSprite);
                this.canvas.removeById(parts.bottomTrackSprite);
                this.canvas.removeById(parts.hullSprite);
                this.canvas.removeById(parts.turretSprite);
                this.canvas.removeById(parts.weaponSprite);
                this.tanks.delete(id);
            }
        }

        // Update or create tanks
        for (const serverTank of serverTanks) {
            let renderableTank = this.tanks.get(serverTank.id);
            
            const config = tankVisualFromSnapshot(serverTank as ServerTank, this.tankConfigs.get(serverTank.id));
            
            if (!renderableTank) {
                const tankParts = TankPartsCreator.create(
                    config.hullNum,
                    config.trackNum,
                    config.turretNum,
                    config.weaponNum
                );
                const spriteParts = TankSpritePartsCreator.create(
                    config.color,
                    config.hullNum,
                    config.trackNum,
                    config.turretNum,
                    config.weaponNum
                );
                const sprite = new TankSprite(spriteParts, tankParts.track.forwardData, tankParts.track.backwardData);
                
                sprite.spawnDriftSmoke(this.animationManager);

                renderableTank = { id: serverTank.id, sprite, config };
                this.tanks.set(serverTank.id, renderableTank);

                const parts = sprite.tankSpriteParts;
                this.canvas.insert(parts.topTrackSprite);
                this.canvas.insert(parts.bottomTrackSprite);
                this.canvas.insert(parts.hullSprite);
                this.canvas.insert(parts.turretSprite);
                this.canvas.insert(parts.weaponSprite);

                const spawnPoint = new Point(
                    ResolutionManager.worldToCanvasX(serverTank.x),
                    ResolutionManager.worldToCanvasY(serverTank.y)
                );
                if (!this.replayMode) {
                    sprite.spawnTireTracks(this.canvas, spawnPoint, serverTank.angle, this.vanishingTirePairs);
                }
            }
            
            const centerPoint = new Point(ResolutionManager.worldToCanvasX(serverTank.x), ResolutionManager.worldToCanvasY(serverTank.y));

            if (!this.replayMode) {
                let teleported = false;
                if (renderableTank.lastPoint) {
                    const dist = Math.hypot(renderableTank.lastPoint.x - centerPoint.x, renderableTank.lastPoint.y - centerPoint.y);
                    if (dist > 150) {
                        teleported = true;
                    }
                }

                if (teleported || (this.wasReversing && !this.isReversing)) {
                    renderableTank.sprite.vanishTireTracks();

                    let size = 0;
                    for (const _ of this.vanishingTirePairs) size++;
                    if (size > 200) {
                        let removed = 0;
                        this.vanishingTirePairs.applyAndRemove(() => {}, (pair) => {
                            if (removed < 50) {
                                this.canvas.removeById(pair.topTire as unknown as ISprite);
                                this.canvas.removeById(pair.bottomTire as unknown as ISprite);
                                removed++;
                                return true;
                            }
                            return false;
                        }, 0);
                    }

                    renderableTank.sprite.spawnTireTracks(this.canvas, centerPoint, serverTank.angle, this.vanishingTirePairs);
                }
            }

            renderableTank.lastPoint = centerPoint;

            const isIdle = serverTank.isIdle !== undefined ? serverTank.isIdle : false;
            
            if (isIdle) {
                renderableTank.sprite.tankTrackEffect.stopped();
            }
            
            renderableTank.sprite.updateAfterAction(
                centerPoint,
                serverTank.angle,
                serverTank.turretAngle,
                isIdle,
                this.replayMode ? false : this.isReversing,
                this.replayMode
            );
        }
        this.wasReversing = this.isReversing;
        this.tanksDataForHealthBars =
            serverTanks.length > 0 ? serverTanks.map((t) => ({ ...(t as ServerTank) } as ServerTank)) : [];
    }

    private drawHealthOverlaysFromLastSnapshot(): void {
        for (const serverTank of this.tanksDataForHealthBars) {
            const renderableTank = this.tanks.get(serverTank.id);
            if (renderableTank) {
                this.drawShieldRingIfActive(serverTank, renderableTank);
                this.drawHealthAndArmorBars(serverTank, renderableTank);
            }
        }
    }

    private drawShieldRingIfActive(serverTank: ServerTank, renderableTank: RenderableTank): void {
        if (!serverTank.shieldActive) {
            return;
        }
        const hullNum = renderableTank.config.hullNum;
        const tankEntityWidth = ResolutionManager.getTankEntityWidth(hullNum);
        const tankEntityHeight = ResolutionManager.getTankEntityHeight(hullNum);
        const sin = Math.sin(serverTank.angle);
        const cos = Math.cos(serverTank.angle);
        const point2RelativeRotatedX = tankEntityWidth * cos - tankEntityHeight * sin;
        const point2RelativeRotatedY = tankEntityWidth * sin + tankEntityHeight * cos;
        const scaledTankX = ResolutionManager.worldToCanvasX(serverTank.x);
        const scaledTankY = ResolutionManager.worldToCanvasY(serverTank.y);
        const point2 = new Point(scaledTankX + point2RelativeRotatedX, scaledTankY + point2RelativeRotatedY);
        const center = calcMidBetweenTwoPoint(new Point(scaledTankX, scaledTankY), point2);
        const baseR = Math.max(tankEntityWidth, tankEntityHeight) * 0.48;
        this.canvas.addShieldRing(center.x, center.y, baseR);
    }
    
    private drawHealthAndArmorBars(serverTank: ServerTank, renderableTank: RenderableTank): void {
        // Calculate tank dimensions (as in original HealthBarManager.calculateTankWidth)
        const hullNum = renderableTank.config.hullNum;
        const tankEntityWidth = ResolutionManager.getTankEntityWidth(hullNum);
        const tankEntityHeight = ResolutionManager.getTankEntityHeight(hullNum);
        const tankWidth = tankEntityWidth * HEALTH_BAR_WIDTH_COEFF;
        const tankHeight = tankEntityHeight;
        
        const healthWidth = tankWidth / serverTank.maxHealth * serverTank.health;
        
        // Calculate center point (as in original: calcCenter() = calcMidBetweenTwoPoint(points[0], points[2]))
        // serverTank.x and serverTank.y are points[0], we need to calculate points[2] and then center
        // points[0] is top-left before rotation, points[2] is bottom-right before rotation
        // After rotation by angle, we need to calculate where points[2] is
        const sin = Math.sin(serverTank.angle);
        const cos = Math.cos(serverTank.angle);
        // points[2] relative to points[0] before rotation: (width, height)
        const point2RelativeX = tankEntityWidth;
        const point2RelativeY = tankEntityHeight;
        // Rotate the relative vector by angle
        const point2RelativeRotatedX = point2RelativeX * cos - point2RelativeY * sin;
        const point2RelativeRotatedY = point2RelativeX * sin + point2RelativeY * cos;
        // Scale server coordinates to match canvas size
        const scaledTankX = ResolutionManager.worldToCanvasX(serverTank.x);
        const scaledTankY = ResolutionManager.worldToCanvasY(serverTank.y);
        
        // points[2] absolute position (using scaled coordinates)
        const point2 = new Point(
            scaledTankX + point2RelativeRotatedX,
            scaledTankY + point2RelativeRotatedY
        );
        // Center is midpoint between points[0] and points[2]
        const center = calcMidBetweenTwoPoint(new Point(scaledTankX, scaledTankY), point2);
        
        const healthPoint = new Point(
            center.x - healthWidth / 2,
            center.y - tankHeight * 1.5
        );
        
        // Draw health bar (as in original HealthBarManager.drawHealthBar)
        const healthColor = this.getHealthColor(serverTank.health, serverTank.maxHealth);
        this.canvas.addRectangle(new Rectangle(
            healthPoint,
            healthWidth,
            ResolutionManager.HEALTH_BAR_HEIGHT,
            healthColor
        ));
        
        // Draw armor bar if available (as in original HealthBarManager.drawArmorBar)
        if (serverTank.armor !== undefined && serverTank.maxArmor !== undefined && serverTank.maxArmor > 0) {
            const armorWidth = tankWidth / serverTank.maxArmor * serverTank.armor;
            const armorPoint = new Point(
                center.x - armorWidth / 2,
                healthPoint.y + ResolutionManager.HEALTH_BAR_HEIGHT + ResolutionManager.HEALTH_ARMOR_BAR_INDENT_Y
            );
            
            this.canvas.addRectangle(new Rectangle(
                armorPoint,
                armorWidth,
                ResolutionManager.ARMOR_BAR_HEIGHT,
                ARMOR_BAR_COLOR
            ));
        }
    }

    private drawTankName(serverTank: ServerTank, renderableTank: RenderableTank): void {
        const playerId = typeof serverTank.playerId === 'string' ? serverTank.playerId : '';
        if (!playerId) {
            return;
        }
        const label = this.playerLabels.get(playerId) || 'Игрок';
        if (!label) {
            return;
        }

        const hullNum = renderableTank.config.hullNum;
        const tankEntityWidth = ResolutionManager.getTankEntityWidth(hullNum);
        const tankEntityHeight = ResolutionManager.getTankEntityHeight(hullNum);
        const sin = Math.sin(serverTank.angle);
        const cos = Math.cos(serverTank.angle);
        const point2RelativeX = tankEntityWidth;
        const point2RelativeY = tankEntityHeight;
        const point2RelativeRotatedX = point2RelativeX * cos - point2RelativeY * sin;
        const point2RelativeRotatedY = point2RelativeX * sin + point2RelativeY * cos;
        const scaledTankX = ResolutionManager.worldToCanvasX(serverTank.x);
        const scaledTankY = ResolutionManager.worldToCanvasY(serverTank.y);
        const point2 = new Point(scaledTankX + point2RelativeRotatedX, scaledTankY + point2RelativeRotatedY);
        const center = calcMidBetweenTwoPoint(new Point(scaledTankX, scaledTankY), point2);

        const ctx = this.canvas.ctx;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '600 13px Inter, Segoe UI, Arial, sans-serif';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#f2f6ff';
        const healthBarTopY = center.y - tankEntityHeight * 1.5;
        const y = healthBarTopY - ResolutionManager.HEALTH_ARMOR_BAR_INDENT_Y;
        ctx.strokeText(label, center.x, y);
        ctx.fillText(label, center.x, y);
        ctx.restore();
    }

    private drawTankNamesOnTop(): void {
        for (const serverTank of this.tanksDataForHealthBars) {
            const renderableTank = this.tanks.get(serverTank.id);
            if (!renderableTank) {
                continue;
            }
            this.drawTankName(serverTank, renderableTank);
        }
    }
    
    private getHealthColor(health: number, maxHealth: number): string {
        if (health > maxHealth * 0.4)
            return HEALTH_BAR_HIGH_HP_COLOR;
        else if (health > maxHealth * 0.15 && health <= maxHealth * 0.4)
            return HEALTH_BAR_MEDIUM_HP_COLOR;
        else
            return HEALTH_BAR_LOW_HP_COLOR;
    }

    /** true — ключ новый, можно проиграть эффект; false — тот же эффект уже шли в прошлом снимке. */
    private consumeOneShotEffectKey(key: string): boolean {
        if (this.recentOneShotEffectKeys.has(key)) {
            return false;
        }
        this.recentOneShotEffectKeys.add(key);
        if (this.recentOneShotEffectKeys.size > OnlineGameRenderer.ONE_SHOT_EFFECT_KEYS_CAP) {
            this.recentOneShotEffectKeys.clear();
        }
        return true;
    }
    
    private handleExplosions(explosions: ServerExplosion[]): void {
        // Create explosion animations for each explosion (like original AnimationMaker.playDeathAnimation)
        for (const explosion of explosions) {
            const ak = Number(explosion.angle || 0).toFixed(4);
            const key = `exp|${Math.round(explosion.x)}|${Math.round(explosion.y)}|${ak}`;
            if (!this.consumeOneShotEffectKey(key)) {
                continue;
            }
            // Scale coordinates from server (1920x1080) to current canvas size
            const explosionPoint = new Point(ResolutionManager.worldToCanvasX(explosion.x), ResolutionManager.worldToCanvasY(explosion.y));
            const animation = new TankExplosionAnimation(explosionPoint, explosion.angle || 0);
            this.animationManager.add(animation);
        }
    }
    
    private handleBulletImpacts(impacts: ServerBulletImpact[]): void {
        for (const imp of impacts) {
            const key = `imp|${Math.round(imp.x)}|${Math.round(imp.y)}|${Number(imp.angle).toFixed(4)}|${imp.bulletType}`;
            if (!this.consumeOneShotEffectKey(key)) {
                continue;
            }
            const bt = Math.min(Math.max(imp.bulletType, 0), ResolutionManager.BULLET_WIDTH.length - 1);
            const w = ResolutionManager.BULLET_WIDTH[bt] * BULLET_ANIMATION_SIZE_INCREASE_COEFF;
            const h = ResolutionManager.BULLET_HEIGHT[bt] * BULLET_ANIMATION_SIZE_INCREASE_COEFF;
            const sheetVariant = imp.bulletType === 0 ? 0 : 1;
            const p = new Point(ResolutionManager.worldToCanvasX(imp.x), ResolutionManager.worldToCanvasY(imp.y));
            this.animationManager.add(new BulletImpactAnimation(p, imp.angle, w, h, sheetVariant));
        }
    }

    private handleGrenadeExplosions(explosions: ServerGrenadeExplosion[]): void {
        // Create grenade explosion animations (like original AnimationMaker.playGrenadeExplosionAnimation)
        console.log(`[CLIENT] handleGrenadeExplosions: received ${explosions.length} grenade explosions`);
        for (const explosion of explosions) {
            const szRaw =
                explosion.size !== undefined && explosion.size !== null ? Math.round(explosion.size) : 0;
            const key = `gren|${Math.round(explosion.x)}|${Math.round(explosion.y)}|${Number(explosion.angle || 0).toFixed(4)}|${szRaw}`;
            if (!this.consumeOneShotEffectKey(key)) {
                continue;
            }
            // Scale coordinates from server (1920x1080) to current canvas size
            const explosionPoint = new Point(ResolutionManager.worldToCanvasX(explosion.x), ResolutionManager.worldToCanvasY(explosion.y));
            const explosionSize =
                explosion.size !== undefined && explosion.size !== null
                    ? ResolutionManager.scaleWorldLength(explosion.size)
                    : ResolutionManager.GRENADE_EXPLOSION_SIZE;
            const explosionAngle = explosion.angle || 0;
            const animation = new GrenadeExplosionAnimation(explosionPoint, explosionAngle, explosionSize);
            this.animationManager.add(animation);
            console.log(`[CLIENT] Created grenade explosion animation: x=${explosion.x.toFixed(1)}, y=${explosion.y.toFixed(1)}, size=${explosionSize}, angle=${explosionAngle.toFixed(3)}`);
        }
    }

    private updateBullets(serverBullets: any[]): void {
        const currentBulletIds = new Set(serverBullets.map(b => b.id));
        
        // Remove bullets that no longer exist
        for (const [id, bullet] of this.bullets.entries()) {
            if (!currentBulletIds.has(id)) {
                this.canvas.removeById(bullet.sprite);
                this.bullets.delete(id);
            }
        }

        // Update or create bullets
        for (const serverBullet of serverBullets) {
            let renderableBullet = this.bullets.get(serverBullet.id);
            
            if (!renderableBullet) {
                // Default to light bullet (type 0) if type not provided
                const bulletType = serverBullet.type !== undefined ? serverBullet.type : 0;
                console.log(`[CLIENT] Creating bullet sprite: id=${serverBullet.id}, type=${bulletType}, x=${serverBullet.x?.toFixed(1)}, y=${serverBullet.y?.toFixed(1)}, angle=${serverBullet.angle?.toFixed(3)}`);
                const sprite = new BulletSprite(bulletType);
                renderableBullet = { id: serverBullet.id, sprite };
                this.bullets.set(serverBullet.id, renderableBullet);
                this.canvas.insert(sprite);
                console.log(`[CLIENT] Bullet sprite inserted into canvas, totalBullets=${this.bullets.size}`);
            }
            
            // Update bullet position (scale coordinates from server 1920x1080 to current canvas size)
            const bulletPoint = new Point(ResolutionManager.worldToCanvasX(serverBullet.x), ResolutionManager.worldToCanvasY(serverBullet.y));
            renderableBullet.sprite.updateAfterAction(bulletPoint, serverBullet.angle);
        }
    }

    private updateWalls(serverWalls: any[]): void {
        // Get current wall IDs from snapshot
        const currentWallIds = new Set(serverWalls.map(w => w.id));
        
        // Remove walls that no longer exist (when level changes, old walls are removed)
        for (const [id, wall] of this.walls.entries()) {
            if (!currentWallIds.has(id)) {
                this.canvas.removeById(wall.sprite);
                this.walls.delete(id);
            }
        }
        
        // Create or update walls
        for (const serverWall of serverWalls) {
            // Check if wall already exists
            let renderableWall = this.walls.get(serverWall.id);
            
            if (!renderableWall) {
                // Use material and shape from server snapshot
                const materialNum = serverWall.materialNum !== undefined ? serverWall.materialNum : Math.min(this.currentLevel - 1, 2);
                const shapeNum = serverWall.shapeNum !== undefined ? serverWall.shapeNum : 0;
                
                const sprite = new WallSprite(materialNum, shapeNum);
                
                renderableWall = { id: serverWall.id, sprite };
                this.walls.set(serverWall.id, renderableWall);
                this.canvas.insert(sprite);
            }
            
            // For static walls, set position directly (like in original createWall: sprite.point = point, sprite.angle = angle)
            // Don't use updateAfterAction for static walls - it's only for dynamic walls that move
            // Scale coordinates from server (1920x1080) to current canvas size
            renderableWall.sprite.point = new Point(ResolutionManager.worldToCanvasX(serverWall.x), ResolutionManager.worldToCanvasY(serverWall.y));
            renderableWall.sprite.angle = serverWall.angle || 0;
        }
    }

    private updateCrates(serverCrates: ServerCrate[]): void {
        const currentIds = new Set(serverCrates.map((c) => c.id));
        for (const [id, crate] of this.crates.entries()) {
            if (!currentIds.has(id)) {
                this.canvas.removeById(crate.sprite);
                this.crates.delete(id);
            }
        }
        for (const serverCrate of serverCrates) {
            let renderableCrate = this.crates.get(serverCrate.id);
            if (!renderableCrate) {
                const sprite = new DestructibleCrateSprite(serverCrate.skinIndex ?? 0);
                renderableCrate = { id: serverCrate.id, sprite };
                this.crates.set(serverCrate.id, renderableCrate);
                this.canvas.insert(sprite);
            }
            renderableCrate.sprite.point = new Point(
                ResolutionManager.worldToCanvasX(serverCrate.x),
                ResolutionManager.worldToCanvasY(serverCrate.y)
            );
            renderableCrate.sprite.angle = serverCrate.angle || 0;
        }
    }

    private updateItems(serverItems: any[]): void {
        const currentItemIds = new Set(serverItems.map(i => i.id));
        
        // Remove items that no longer exist
        for (const [id, item] of this.items.entries()) {
            if (!currentItemIds.has(id)) {
                this.canvas.removeById(item.sprite);
                this.items.delete(id);
            }
        }

        // Update or create items
        for (const serverItem of serverItems) {
            let renderableItem = this.items.get(serverItem.id);
            const itemPoint = new Point(
                ResolutionManager.worldToCanvasX(serverItem.x),
                ResolutionManager.worldToCanvasY(serverItem.y)
            );

            if (!renderableItem) {
                const sprite = createPickupItemSprite(serverItem.type, itemPoint, serverItem.id);
                renderableItem = { id: serverItem.id, sprite };
                this.items.set(serverItem.id, renderableItem);
                this.canvas.insert(sprite);
            } else if (renderableItem.sprite instanceof PickupItemSprite) {
                renderableItem.sprite.setBasePoint(itemPoint);
            } else {
                renderableItem.sprite.point = itemPoint;
                renderableItem.sprite.angle = 0;
            }
        }
    }

    private tickPickupItemAnimations(deltaTimeMs: number): void {
        for (const item of this.items.values()) {
            if (item.sprite instanceof PickupItemSprite) {
                item.sprite.tickAnimation(deltaTimeMs);
            }
        }
    }

    private syncReplayPickupItemAnimations(): void {
        for (const [id, item] of this.items) {
            if (item.sprite instanceof PickupItemSprite) {
                const startFrame = this.replayItemStartFrames.get(id) ?? 0;
                const elapsedMs = Math.max(0, this.replayPositionFrame - startFrame) * this.replayFrameMs;
                item.sprite.seekAnimation(elapsedMs);
            }
        }
    }

    private processVanishingTireTracks(deltaTimeMs: number): void {
        this.vanishingTirePairs.applyAndRemove(
            (pair, dt) => {
                const step = OnlineGameRenderer.TIRE_VANISH_OPACITY_PER_MS * dt;
                pair.topTire.opacity = Math.max(0, pair.topTire.opacity - step);
                pair.bottomTire.opacity = Math.max(0, pair.bottomTire.opacity - step);
            },
            (pair) => {
                const gone = pair.topTire.opacity <= 0.02 && pair.bottomTire.opacity <= 0.02;
                if (gone) {
                    this.canvas.removeById(pair.topTire as unknown as ISprite);
                    this.canvas.removeById(pair.bottomTire as unknown as ISprite);
                }
                return gone;
            },
            deltaTimeMs
        );
    }

    /** Затухание следов по времени реплея (мс), а не по FPS браузера. */
    private applyReplayTireEvaporation(positionFrame: number): void {
        const fadeMs = OnlineGameRenderer.TIRE_VANISH_DURATION_MS;
        const frameMs = this.replayFrameMs;
        this.vanishingTirePairs.applyAndRemove(
            (pair) => {
                const start = this.replayVanishStartFrame.get(pair) ?? 0;
                const elapsedMs = Math.max(0, (positionFrame - start) * frameMs);
                const opacity = Math.max(0, 1 - elapsedMs / fadeMs);
                pair.topTire.opacity = opacity;
                pair.bottomTire.opacity = opacity;
            },
            (pair) => {
                const start = this.replayVanishStartFrame.get(pair) ?? 0;
                const elapsedMs = Math.max(0, (positionFrame - start) * frameMs);
                const opacity = Math.max(0, 1 - elapsedMs / fadeMs);
                const gone = opacity <= 0.02;
                if (gone) {
                    this.canvas.removeById(pair.topTire as unknown as ISprite);
                    this.canvas.removeById(pair.bottomTire as unknown as ISprite);
                    this.replayVanishStartFrame.delete(pair);
                }
                return gone;
            },
            0
        );
    }

    public render(deltaTimeMs: number = 16): void {
        const dt = Math.max(0, deltaTimeMs);
        if (this.replayMode) {
            this.canvas.setAnimationClockMs(this.replayPositionFrame * this.replayFrameMs);
            this.applyReplayTireEvaporation(this.replayPositionFrame);
            this.syncReplayPickupItemAnimations();
        } else {
            this.canvas.setAnimationClockMs(null);
            this.processVanishingTireTracks(dt);
            this.tickPickupItemAnimations(dt);
        }
        this.animationManager.handle(dt);
        this.drawHealthOverlaysFromLastSnapshot();
        this.canvas.drawAll();
        this.drawTankNamesOnTop();
    }

    public clear(): void {
        this.clearReplayVisualAnimations();
        this.replayVisualEffectTimeline = [];
        this.replayEffectSource = null;
        this.replayItemStartFrames.clear();
        const lingering = [...this.vanishingTirePairs];
        for (const pair of lingering) {
            this.canvas.removeById(pair.topTire as unknown as ISprite);
            this.canvas.removeById(pair.bottomTire as unknown as ISprite);
        }
        this.vanishingTirePairs.clear();
        this.canvas.clear();
        this.tanksDataForHealthBars = [];
        this.tanks.clear();
        this.bullets.clear();
        this.walls.clear();
        this.crates.clear();
        this.items.clear();
        this.backgroundMaterial = undefined;
    }
}
