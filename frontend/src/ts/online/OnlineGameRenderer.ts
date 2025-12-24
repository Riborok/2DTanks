import { Canvas } from '../game/processors/ICanvas';
import { Size } from '../additionally/type';
import { GameWorldSnapshot } from './types';
import { Point } from '../geometry/Point';
import { TankSprite } from '../sprite/tank/TankSprite';
import { TankSpritePartsCreator } from '../sprite/tank/TankSpritePartsCreator';
import { TankPartsCreator } from '../components/tank parts/TankPartsCreator';
import { ResolutionManager, Bonus, HEALTH_BAR_WIDTH_COEFF, HEALTH_BAR_HIGH_HP_COLOR, HEALTH_BAR_MEDIUM_HP_COLOR, HEALTH_BAR_LOW_HP_COLOR, ARMOR_BAR_COLOR } from '../constants/gameConstants';
import { BulletSprite } from '../sprite/bullet/BulletSprite';
import { WallSprite } from '../sprite/obstacles/WallSprite';
import { ISprite } from '../sprite/ISprite';
import { KeySprite } from '../sprite/collectable/KeySprite';
import { BoxSprite } from '../sprite/collectable/BoxSprite';
import { BackgroundSprite } from '../sprite/background/BackgroundSprite';
import { SpriteManipulator } from '../sprite/SpriteManipulator';
import { DecorCreator } from '../game/creators/IDecorCreator';
import { AnimationManager } from '../game/managers/animation managers/AnimationManager';
import { Rectangle } from '../game/processors/shapes/IRectangle';
import { calcDistance, calcMidBetweenTwoPoint } from '../geometry/additionalFunc';
import { ServerTank, ServerExplosion, ServerGrenadeExplosion } from './types';
import { TankExplosionAnimation } from '../sprite/animation/TankExplosionAnimation';
import { GrenadeExplosionAnimation } from '../sprite/animation/GrenadeExplosionAnimation';

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
}

interface RenderableBullet {
    id: number;
    sprite: BulletSprite;
}

interface RenderableWall {
    id: number;
    sprite: WallSprite;
}

interface RenderableItem {
    id: number;
    sprite: ISprite;
}

export class OnlineGameRenderer {
    private canvas: Canvas;
    private animationManager: AnimationManager;
    private tanks: Map<string, RenderableTank> = new Map();
    private bullets: Map<number, RenderableBullet> = new Map();
    private walls: Map<number, RenderableWall> = new Map();
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

    constructor(ctx: CanvasRenderingContext2D, size: Size) {
        this.canvas = new Canvas(ctx, size);
        this.animationManager = new AnimationManager(this.canvas);
        // Background will be set when first snapshot arrives with level info
        // Don't set up background here - wait for snapshot with level info
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
        
        // Create background tiles using DecorCreator (same as original)
        // Use actual canvas size for background (it's already adjusted for panel height)
        const size = { width: this.canvas.ctx.canvas.width, height: this.canvas.ctx.canvas.height };
        
        // Ensure canvas has valid size before creating background
        if (size.width > 0 && size.height > 0) {
            console.log('[CLIENT] Setting up background, materialNum:', materialNum, 'canvas size:', size);
            DecorCreator.fullFillBackground(materialNum, size, this.canvas);
            
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
        // Update background if level changed or if background hasn't been set yet (first snapshot)
        if (snapshot.currentLevel !== this.currentLevel || this.backgroundMaterial === undefined) {
            // Material based on level: level 1 = material 1 (Ground), level 2 = material 2 (Sandstone), level 3 = material 0 (Grass)
            // But server sends: level 1 = backgroundMaterial 1, level 2 = backgroundMaterial 2, level 3 = backgroundMaterial 0
            // So we use: level - 1, but for level 3 it's 0, so: (level - 1) % 3
            // Actually, from server code: level 1 -> backgroundMaterial 1, level 2 -> backgroundMaterial 2, level 3 -> backgroundMaterial 0
            const materialNum = snapshot.currentLevel === 3 ? 0 : snapshot.currentLevel - 1;
            this.setupBackground(materialNum);
            this.currentLevel = snapshot.currentLevel;
        }

        // Update tanks
        this.updateTanks(snapshot.tanks);
        
        // Update bullets
        this.updateBullets(snapshot.bullets || []);
        
        // Update walls (on first snapshot or when level changes)
        // Check if level changed - if so, clear old walls and update with new ones
        if (snapshot.currentLevel !== this.currentLevel) {
            // Level changed - clear all walls
            for (const [id, wall] of this.walls.entries()) {
                this.canvas.removeById(wall.sprite);
            }
            this.walls.clear();
        }
        // Update walls if we have walls in snapshot (either first time or after level change)
        if (snapshot.walls.length > 0) {
            this.updateWalls(snapshot.walls);
        }
        
        // Update items
        this.updateItems(snapshot.items || []);
        
        // Handle explosions (create animations for new explosions)
        if (snapshot.explosions && snapshot.explosions.length > 0) {
            this.handleExplosions(snapshot.explosions);
        }
        
        // Handle grenade explosions
        if (snapshot.grenadeExplosions && snapshot.grenadeExplosions.length > 0) {
            this.handleGrenadeExplosions(snapshot.grenadeExplosions);
        }
    }

    private updateTanks(serverTanks: any[]): void {
        const currentTankIds = new Set(serverTanks.map(t => t.id));
        
        // Remove tanks that no longer exist
        for (const [id, tank] of this.tanks.entries()) {
            if (!currentTankIds.has(id)) {
                // Remove tank sprites
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
            
            // Get config from stored configs or use defaults
            const config = this.tankConfigs.get(serverTank.id) || {
                hullNum: 0,
                trackNum: 0,
                turretNum: 0,
                weaponNum: 0,
                color: 0
            };
            
            if (!renderableTank) {
                // Create new tank sprite
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
                
                // Initialize drift smoke (as in original TankHandlingManager.add)
                sprite.spawnDriftSmoke(this.animationManager);
                
                renderableTank = { id: serverTank.id, sprite, config };
                this.tanks.set(serverTank.id, renderableTank);
                
                // Insert sprites into canvas
                const parts = sprite.tankSpriteParts;
                this.canvas.insert(parts.topTrackSprite);
                this.canvas.insert(parts.bottomTrackSprite);
                this.canvas.insert(parts.hullSprite);
                this.canvas.insert(parts.turretSprite);
                this.canvas.insert(parts.weaponSprite);
            }
            
            // Update tank position and angles
            // Scale coordinates from server (1920x1080) to current canvas size
            const centerPoint = new Point(ResolutionManager.resizeX(serverTank.x), ResolutionManager.resizeY(serverTank.y));
            const isIdle = serverTank.isIdle !== undefined ? serverTank.isIdle : false;
            
            // Stop track animation if tank is idle (as in original TankMovementManager.residualMovement)
            if (isIdle) {
                renderableTank.sprite.tankTrackEffect.stopped();
            }
            
            renderableTank.sprite.updateAfterAction(centerPoint, serverTank.angle, serverTank.turretAngle, isIdle);
            
            // Draw health and armor bars (as in original HealthBarManager.drawBar)
            this.drawHealthAndArmorBars(serverTank, renderableTank);
        }
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
        const scaledTankX = ResolutionManager.resizeX(serverTank.x);
        const scaledTankY = ResolutionManager.resizeY(serverTank.y);
        
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
    
    private getHealthColor(health: number, maxHealth: number): string {
        if (health > maxHealth * 0.4)
            return HEALTH_BAR_HIGH_HP_COLOR;
        else if (health > maxHealth * 0.15 && health <= maxHealth * 0.4)
            return HEALTH_BAR_MEDIUM_HP_COLOR;
        else
            return HEALTH_BAR_LOW_HP_COLOR;
    }
    
    private handleExplosions(explosions: ServerExplosion[]): void {
        // Create explosion animations for each explosion (like original AnimationMaker.playDeathAnimation)
        for (const explosion of explosions) {
            // Scale coordinates from server (1920x1080) to current canvas size
            const explosionPoint = new Point(ResolutionManager.resizeX(explosion.x), ResolutionManager.resizeY(explosion.y));
            const animation = new TankExplosionAnimation(explosionPoint, explosion.angle || 0);
            this.animationManager.add(animation);
        }
    }
    
    private handleGrenadeExplosions(explosions: ServerGrenadeExplosion[]): void {
        // Create grenade explosion animations (like original AnimationMaker.playGrenadeExplosionAnimation)
        console.log(`[CLIENT] handleGrenadeExplosions: received ${explosions.length} grenade explosions`);
        for (const explosion of explosions) {
            // Scale coordinates from server (1920x1080) to current canvas size
            const explosionPoint = new Point(ResolutionManager.resizeX(explosion.x), ResolutionManager.resizeY(explosion.y));
            const explosionSize = explosion.size || ResolutionManager.GRENADE_EXPLOSION_SIZE;
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
            const bulletPoint = new Point(ResolutionManager.resizeX(serverBullet.x), ResolutionManager.resizeY(serverBullet.y));
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
            renderableWall.sprite.point = new Point(ResolutionManager.resizeX(serverWall.x), ResolutionManager.resizeY(serverWall.y));
            renderableWall.sprite.angle = serverWall.angle || 0;
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
            
            if (!renderableItem) {
                let sprite: ISprite;
                // Scale coordinates from server (1920x1080) to current canvas size
                const itemPoint = new Point(ResolutionManager.resizeX(serverItem.x), ResolutionManager.resizeY(serverItem.y));
                console.log(`[CLIENT] Creating item sprite: id=${serverItem.id}, type=${serverItem.type}`);
                if (serverItem.type === Bonus.key) {
                    sprite = new KeySprite(itemPoint, 0);
                } else {
                    sprite = new BoxSprite(serverItem.type, itemPoint, 0);
                }
                renderableItem = { id: serverItem.id, sprite };
                this.items.set(serverItem.id, renderableItem);
                this.canvas.insert(sprite);
            } else {
                // Update item position (scale coordinates from server 1920x1080 to current canvas size)
                const itemPoint = new Point(ResolutionManager.resizeX(serverItem.x), ResolutionManager.resizeY(serverItem.y));
                renderableItem.sprite.point = itemPoint;
                renderableItem.sprite.angle = 0;
            }
        }
    }

    public render(): void {
        // Update animations (for drift smoke)
        this.animationManager.handle(16); // Approximate deltaTime
        this.canvas.drawAll();
    }

    public clear(): void {
        this.canvas.clear();
        this.tanks.clear();
        this.bullets.clear();
        this.walls.clear();
        this.items.clear();
        this.backgroundMaterial = 1; // Reset to default
    }
}
