import { TankConfig, Size } from '../../utils/types';
import { Point } from '../../geometry/Point';
import { TankModel, ITankModel } from '../../model/tank/ITankModel';
import { IBulletModel } from '../../model/bullet/IBulletModel';
import { TankPartsCreator } from '../../components/tank_parts/TankPartsCreator';
import { RectangularEntity } from '../../polygon/entity/IEntity';
import { ResolutionManager, RESISTANCE_COEFFICIENT, AIR_RESISTANCE_COEFFICIENT, OBSTACLE_WALL_WIDTH_AMOUNT, OBSTACLE_WALL_HEIGHT_AMOUNT, SPAWN_GRIDS_LINES_AMOUNT, SPAWN_GRIDS_COLUMNS_AMOUNT, Bonus } from '../../constants/gameConstants';
import { ModelIDTracker } from '../../utils/IDTracker';
import { EntityManipulator } from '../../polygon/entity/EntityManipulator';
import { Quadtree, ICollisionSystem } from '../../polygon/ICollisionSystem';
import { PointSpawner } from '../spawn/PointSpawner';
import { ObstacleCreator, ServerWall } from './ObstacleCreator';
import { MazeCreator } from './MazeCreator';
import { getRandomInt } from '../../utils/additionalFunc';
import { CollisionResolver } from '../../geometry/CollisionResolver';
import { IEntity } from '../../polygon/entity/IEntity';
import { CollisionDetector } from '../../geometry/CollisionDetector';

interface ServerTank {
    id: string;
    model: ITankModel;
    playerId: string;
    role: 'attacker' | 'defender';
}

interface ServerBullet {
    id: number;
    model: IBulletModel;
    sourceId: string;
    bulletNum: number; // Bullet type number for rendering
}

interface ServerItem {
    id: number;
    x: number;
    y: number;
    type: Bonus;
}

export class GameWorld {
    private tick: number = 0;
    private roomCode: string;
    private startTime: number;
    private readonly FINISH_TIME = 300000; // 300 seconds in milliseconds
    private readonly SIZE: Size = { width: 1920, height: 1080 };
    
    // Number of keys to spawn and collect per level
    private static readonly REQUIRED_KEYS_PER_LEVEL: number = 1;
    
    private tanks: Map<string, ServerTank> = new Map();
    private bullets: Map<number, ServerBullet> = new Map();
    private walls: ServerWall[] = [];
    private items: Map<number, ServerItem> = new Map();
    private collisionSystem: ICollisionSystem<IEntity>;
    
    private currentLevel: number = 1;
    private keysCollected: number = 0;
    private backgroundMaterial: number = 1;
    
    // Bonus box spawning (like BonusSpawnManager)
    private ammoSpawnInterval: number = 5000; // Start with 5 seconds
    private ammoSpawnTimer: number = 0;
    private static readonly MAX_AMMO_SPAWN_INTERVAL: number = 60000; // 60 seconds max
    private wallMaterial: number = 2;
    private pointSpawner: PointSpawner | null = null;
    
    private attackerConfig: TankConfig;
    private defenderConfig: TankConfig;
    
    // Track which tanks received actions in the current tick to avoid double-processing
    private tanksWithActionsThisTick: Set<string> = new Set();
    
    // Track tank explosions for current tick (cleared each update)
    private explosionsThisTick: Array<{ x: number; y: number; angle: number }> = [];
    
    // Track grenade explosions for current tick (cleared each update)
    private grenadeExplosionsThisTick: Array<{ x: number; y: number; angle: number; size: number }> = [];

    constructor(attackerConfig: TankConfig, defenderConfig: TankConfig, roomCode: string) {
        this.roomCode = roomCode;
        this.startTime = Date.now();
        this.attackerConfig = attackerConfig;
        this.defenderConfig = defenderConfig;
        
        // Initialize collision system with Quadtree
        this.collisionSystem = new Quadtree<IEntity>(0, 0, this.SIZE.width, this.SIZE.height);
        
        this.initializeLevel(1);
    }

    private initializeLevel(level: number): void {
        this.currentLevel = level;
        // Reset bonus box spawn timer when level changes
        this.ammoSpawnTimer = 0;
        this.ammoSpawnInterval = 5000; // Reset to initial interval
        
        // Determine materials based on level
        if (level === 1) {
            this.backgroundMaterial = 1;
            this.wallMaterial = 2;
        } else if (level === 2) {
            this.backgroundMaterial = 2;
            this.wallMaterial = 1;
        } else {
            this.backgroundMaterial = 0;
            this.wallMaterial = 0;
        }
        
        // Create walls
        const { wallsArray, point } = ObstacleCreator.createWallsAroundPerimeter(
            OBSTACLE_WALL_WIDTH_AMOUNT, OBSTACLE_WALL_HEIGHT_AMOUNT, this.wallMaterial, this.SIZE
        );
        this.walls = wallsArray;
        
        // Add walls to collision system
        for (const wall of this.walls) {
            this.collisionSystem.insert(wall.model.entity);
        }
        
        // Create point spawner
        this.pointSpawner = new PointSpawner(point, SPAWN_GRIDS_LINES_AMOUNT, SPAWN_GRIDS_COLUMNS_AMOUNT);
        
        // Create maze walls
        let mazeWalls: ServerWall[] = [];
        if (level === 1) {
            mazeWalls = MazeCreator.createMazeLvl1(this.wallMaterial, point);
        } else if (level === 2) {
            mazeWalls = MazeCreator.createMazeLvl2(this.wallMaterial, point);
        } else {
            mazeWalls = MazeCreator.createMazeLvl3(this.wallMaterial, point);
        }
        
        for (const wall of mazeWalls) {
            this.collisionSystem.insert(wall.model.entity);
        }
        this.walls.push(...mazeWalls);
        
        // Spawn tanks
        this.spawnTanks();
        
        // Spawn keys
        this.spawnKeys();
    }

    private spawnTanks(): void {
        if (!this.pointSpawner) return;
        
        // Remove existing tanks from collision system if they exist (for level transitions)
        for (const tank of this.tanks.values()) {
            try {
                this.collisionSystem.remove(tank.model.entity);
            } catch (e) {
                // Tank not in system, that's fine
            }
        }
        this.tanks.clear();
        
        // Spawn attacker
        const attackerTankParts = TankPartsCreator.create(
            this.attackerConfig.hullNum,
            this.attackerConfig.trackNum,
            this.attackerConfig.turretNum,
            this.attackerConfig.weaponNum
        );
        
        const attackerSpawnPoint = this.pointSpawner.getRandomSpawnPoint(
            ResolutionManager.getTankEntityWidth(this.attackerConfig.hullNum),
            ResolutionManager.getTankEntityHeight(this.attackerConfig.hullNum),
            0, SPAWN_GRIDS_LINES_AMOUNT - 1,
            0, Math.floor(SPAWN_GRIDS_COLUMNS_AMOUNT / 2)
        );
        
        const attackerEntity = new RectangularEntity(
            attackerSpawnPoint,
            ResolutionManager.getTankEntityWidth(this.attackerConfig.hullNum),
            ResolutionManager.getTankEntityHeight(this.attackerConfig.hullNum),
            0,
            attackerTankParts.hull.mass + attackerTankParts.turret.mass + attackerTankParts.weapon.mass,
            ModelIDTracker.tankId
        );
        
        const attackerModel = new TankModel(attackerTankParts, attackerEntity);
        const attackerTank: ServerTank = {
            id: `attacker_${Date.now()}`,
            model: attackerModel,
            playerId: '', // Will be set when player connects
            role: 'attacker'
        };
        this.tanks.set(attackerTank.id, attackerTank);
        this.collisionSystem.insert(attackerEntity);
        
        // Spawn defender
        const defenderTankParts = TankPartsCreator.create(
            this.defenderConfig.hullNum,
            this.defenderConfig.trackNum,
            this.defenderConfig.turretNum,
            this.defenderConfig.weaponNum
        );
        
        const defenderSpawnPoint = this.pointSpawner.getRandomSpawnPoint(
            ResolutionManager.getTankEntityWidth(this.defenderConfig.hullNum),
            ResolutionManager.getTankEntityHeight(this.defenderConfig.hullNum),
            0, SPAWN_GRIDS_LINES_AMOUNT - 1,
            Math.ceil(SPAWN_GRIDS_COLUMNS_AMOUNT / 2), SPAWN_GRIDS_COLUMNS_AMOUNT - 1
        );
        
        const defenderEntity = new RectangularEntity(
            defenderSpawnPoint,
            ResolutionManager.getTankEntityWidth(this.defenderConfig.hullNum),
            ResolutionManager.getTankEntityHeight(this.defenderConfig.hullNum),
            0,
            defenderTankParts.hull.mass + defenderTankParts.turret.mass + defenderTankParts.weapon.mass,
            ModelIDTracker.tankId
        );
        
        const defenderModel = new TankModel(defenderTankParts, defenderEntity);
        const defenderTank: ServerTank = {
            id: `defender_${Date.now()}`,
            model: defenderModel,
            playerId: '', // Will be set when player connects
            role: 'defender'
        };
        this.tanks.set(defenderTank.id, defenderTank);
        this.collisionSystem.insert(defenderEntity);
    }

    public setPlayerTankMapping(attackerPlayerId: string, defenderPlayerId: string): void {
        for (const tank of this.tanks.values()) {
            if (tank.role === 'attacker') {
                tank.playerId = attackerPlayerId;
            } else {
                tank.playerId = defenderPlayerId;
            }
        }
    }

    private spawnKeys(): void {
        if (!this.pointSpawner) {
            console.log('[GAMEWORLD] spawnKeys: pointSpawner is null, cannot spawn keys');
            return;
        }
        
        console.log(`[GAMEWORLD] spawnKeys: spawning ${GameWorld.REQUIRED_KEYS_PER_LEVEL} keys`);
        for (let i = 0; i < GameWorld.REQUIRED_KEYS_PER_LEVEL; i++) {
            const spawnPoint = this.pointSpawner.getRandomSpawnPoint(
                ResolutionManager.KEY_SIZE,
                ResolutionManager.KEY_SIZE,
                0, SPAWN_GRIDS_LINES_AMOUNT - 1,
                Math.ceil(SPAWN_GRIDS_COLUMNS_AMOUNT / 2), SPAWN_GRIDS_COLUMNS_AMOUNT - 1
            );
            
            const item: ServerItem = {
                id: ModelIDTracker.collectibleItemId,
                x: spawnPoint.x,
                y: spawnPoint.y,
                type: Bonus.key
            };
            this.items.set(item.id, item);
            console.log(`[GAMEWORLD] spawnKeys: created key item id=${item.id}, x=${item.x.toFixed(1)}, y=${item.y.toFixed(1)}, type=${item.type}, totalItems=${this.items.size}`);
        }
    }
    
    private advanceToNextLevel(): void {
        const nextLevel = this.currentLevel + 1;
        console.log(`[GAMEWORLD] advanceToNextLevel: advancing from level ${this.currentLevel} to level ${nextLevel}`);
        
        // Save player IDs before clearing tanks (needed to restore mapping after respawn)
        const attackerPlayerId = Array.from(this.tanks.values()).find(t => t.role === 'attacker')?.playerId || '';
        const defenderPlayerId = Array.from(this.tanks.values()).find(t => t.role === 'defender')?.playerId || '';
        
        // Clear bullets
        for (const bullet of this.bullets.values()) {
            this.collisionSystem.remove(bullet.model.entity);
        }
        this.bullets.clear();
        
        // Clear items (keys and boxes) - new keys will be spawned
        this.items.clear();
        
        // Remove walls from collision system
        for (const wall of this.walls) {
            this.collisionSystem.remove(wall.model.entity);
        }
        this.walls = [];
        
        // Remove tanks from collision system before respawn
        for (const tank of this.tanks.values()) {
            this.collisionSystem.remove(tank.model.entity);
        }
        // Tanks will be cleared and respawned in spawnTanks()
        
        // Initialize new level (this will create new walls, spawn new tanks and keys)
        // keysCollected is NOT reset - it persists across levels
        this.initializeLevel(nextLevel);
        
        // Restore player tank mapping after respawn (new tanks have empty playerId)
        if (attackerPlayerId || defenderPlayerId) {
            this.setPlayerTankMapping(attackerPlayerId, defenderPlayerId);
            console.log(`[GAMEWORLD] advanceToNextLevel: restored player mappings - attacker: ${attackerPlayerId}, defender: ${defenderPlayerId}`);
        }
        
        console.log(`[GAMEWORLD] advanceToNextLevel: level ${nextLevel} initialized, keysCollected=${this.keysCollected}`);
    }

    private applyTankMovement(tank: ServerTank, actionType: 'forward' | 'backward' | 'residual', 
                              angularActionType: 'left' | 'right' | 'residual',
                              deltaTime: number): void {
        const resistanceCoeff = RESISTANCE_COEFFICIENT[this.backgroundMaterial];
        const airResistanceCoeff = AIR_RESISTANCE_COEFFICIENT;
        
        // Remove from collision system before movement (as in original TankMovementManager.hullUpdate)
        this.collisionSystem.remove(tank.model.entity);
        
        // Apply movement action (changes velocity)
        if (actionType === 'forward') {
            tank.model.forwardMovement(resistanceCoeff, airResistanceCoeff, deltaTime);
        } else if (actionType === 'backward') {
            tank.model.backwardMovement(resistanceCoeff, airResistanceCoeff, deltaTime);
        } else {
            tank.model.residualMovement(resistanceCoeff, airResistanceCoeff, deltaTime);
        }
        
        // Apply angular movement action (changes angular velocity)
        if (angularActionType === 'left') {
            tank.model.counterclockwiseMovement(resistanceCoeff, airResistanceCoeff, deltaTime);
        } else if (angularActionType === 'right') {
            tank.model.clockwiseMovement(resistanceCoeff, airResistanceCoeff, deltaTime);
        } else {
            tank.model.residualAngularMovement(resistanceCoeff, airResistanceCoeff, deltaTime);
        }
        
        // Apply physics movement (as in original TankMovementManager.hullUpdate - after action, before collision)
        EntityManipulator.movement(tank.model.entity);
        EntityManipulator.angularMovement(tank.model.entity);
        
        // Check and resolve collisions immediately after movement (as in original)
        const collisions = Array.from(this.collisionSystem.getCollisions(tank.model.entity));
        for (const collided of collisions) {
            // Don't resolve collision with self
            if (collided.id !== tank.model.entity.id) {
                CollisionResolver.resolveCollision(tank.model.entity, collided);
            }
        }
        
        // Re-insert into collision system (as in original TankMovementManager.hullUpdate)
        this.collisionSystem.insert(tank.model.entity);
    }

    public handlePlayerAction(playerId: string, action: any, deltaTime: number): void {
        const tank = Array.from(this.tanks.values()).find(t => t.playerId === playerId);
        if (!tank) {
            return;
        }

        // Log only if there are actual actions (at least one key pressed)
        const hasAction = action.forward || action.backward || action.turnLeft || action.turnRight || 
                         action.turretLeft || action.turretRight || action.shoot;
        if (hasAction) {
            console.log(`[GAMEWORLD] Player ${playerId} (tank ${tank.id}) action:`, JSON.stringify(action));
        }

        // Determine movement action type (as in original TankHandlingManager)
        let movementActionType: 'forward' | 'backward' | 'residual';
        if (action.forward && !action.backward) {
            movementActionType = 'forward';
        } else if (action.backward && !action.forward) {
            movementActionType = 'backward';
        } else {
            movementActionType = 'residual';
        }
        
        // Determine angular movement action type (as in original TankHandlingManager)
        let angularActionType: 'left' | 'right' | 'residual';
        if (action.turnLeft && !action.turnRight) {
            angularActionType = 'left';
        } else if (action.turnRight && !action.turnLeft) {
            angularActionType = 'right';
        } else {
            angularActionType = 'residual';
        }
        
        // Apply movement with collisions (as in original hullUpdate)
        this.applyTankMovement(tank, movementActionType, angularActionType, deltaTime);
        
        // Mark this tank as having received an action this tick
        this.tanksWithActionsThisTick.add(tank.id);

        // Handle turret rotation (doesn't affect collisions)
        if (action.turretLeft) {
            tank.model.turretCounterclockwiseMovement(deltaTime);
        } else if (action.turretRight) {
            tank.model.turretClockwiseMovement(deltaTime);
        }

        // Handle shooting
        if (action.shoot) {
            const bullet = tank.model.shot();
            if (bullet) {
                // In original, checkForSpawn is called BEFORE adding to collision system
                // It uses resolveCollision which checks collisions WITHOUT requiring entity to be in system
                // We should NOT add bullet to collision system here - wait until first update
                // But we should check if there's an immediate collision (like checkForSpawn does)
                // However, since getCollisions works with entities not in system, we can check here
                
                // Check for immediate collision BEFORE adding to system (like checkForSpawn)
                const immediateCollisions = Array.from(this.collisionSystem.getCollisions(bullet.entity));
                // Filter out collision with source tank (as in original, source tank collision is ignored)
                const validCollisions = immediateCollisions.filter(collided => {
                    return collided.id !== tank.model.entity.id;
                });
                
                // Only create bullet if no immediate collision with other objects
                if (validCollisions.length === 0) {
                    const serverBullet: ServerBullet = {
                        id: bullet.entity.id,
                        model: bullet,
                        sourceId: tank.id,
                        bulletNum: tank.model.bulletNum // Store bullet type for rendering
                    };
                    this.bullets.set(serverBullet.id, serverBullet);
                    // IMPORTANT: Don't insert into collision system here!
                    // Wait until first update, like in original (bullet is inserted in update method after movement)
                    console.log(`[GAMEWORLD] Bullet created: id=${serverBullet.id}, bulletNum=${serverBullet.bulletNum}, x=${bullet.entity.points[0].x.toFixed(1)}, y=${bullet.entity.points[0].y.toFixed(1)}, angle=${bullet.entity.angle.toFixed(3)}, totalBullets=${this.bullets.size}`);
                } else {
                    const collisionIds = validCollisions.map(c => {
                        const tank = Array.from(this.tanks.values()).find(t => t.model.entity.id === c.id);
                        const wall = this.walls.find(w => w.model.entity.id === c.id);
                        if (tank) return `tank_${tank.id}`;
                        if (wall) return `wall_${c.id}`;
                        return `unknown_${c.id}`;
                    });
                    console.log(`[GAMEWORLD] Bullet creation blocked: immediate collision with ${validCollisions.length} objects: ${collisionIds.join(', ')}`);
                }
            }
        }
    }

    public update(deltaTime: number): void {
        this.tick++;
        
        // Don't clear explosions here - they need to be sent in the snapshot first
        // We'll clear them after getSnapshot() is called, or at the start of next update
        // But for now, we clear them at the start so they're fresh for this tick
        this.explosionsThisTick = [];
        this.grenadeExplosionsThisTick = [];
        
        const resistanceCoeff = RESISTANCE_COEFFICIENT[this.backgroundMaterial];
        const airResistanceCoeff = AIR_RESISTANCE_COEFFICIENT;

        // Update tanks that didn't receive actions this tick (residual movement)
        // As in original TankHandlingManager, residual movement is applied every tick for tanks without input
        // But only if tank is not idle (as in original TankMovementManager.residualMovement)
        for (const tank of this.tanks.values()) {
            // Skip tanks that already processed actions in handlePlayerAction
            if (this.tanksWithActionsThisTick.has(tank.id)) {
                continue;
            }
            
            // Skip tanks that are completely idle (no velocity, no angular velocity) - no need to apply residual movement
            // In original, TankMovementManager.residualMovement checks isIdle() and skips hullUpdate for idle tanks
            // So we can skip applying movement entirely for idle tanks
            if (tank.model.isIdle() && tank.model.isAngularMotionStopped()) {
                continue;
            }
            
            // Apply residual movement with collisions (as in original TankHandlingManager.handle)
            this.applyTankMovement(tank, 'residual', 'residual', deltaTime);
        }
        
        // Reset the set for the next tick
        this.tanksWithActionsThisTick.clear();

        // Update bullets (similar to BulletHandlingManager.handle)
        const bulletsToRemove: number[] = [];
        for (const bullet of this.bullets.values()) {
            // Skip idle bullets (as in original: if (!bulletElement.model.isIdle()) this.update(...))
            if (bullet.model.isIdle()) {
                bulletsToRemove.push(bullet.id);
                console.log(`[GAMEWORLD] Bullet ${bullet.id} marked for removal: isIdle=true (before update)`);
                continue;
            }
            
            // For newly created bullets, they're not in collision system yet
            // Remove from collision system if it's there (shouldn't be for new bullets)
            try {
                this.collisionSystem.remove(bullet.model.entity);
            } catch (e) {
                // Bullet not in system yet, that's fine
            }
            
            EntityManipulator.movement(bullet.model.entity);
            bullet.model.residualMovement(airResistanceCoeff, deltaTime);
            
            // Insert into collision system to check collisions at new position (like in original update method)
            this.collisionSystem.insert(bullet.model.entity);
            
            // Check if bullet should be removed (similar to hasResidualMovement: !isIdle)
            // Bullet is removed if it's idle (velocity = 0) OR if it collided
            const isIdle = bullet.model.isIdle();
            const allCollisions = Array.from(this.collisionSystem.getCollisions(bullet.model.entity));
            // Filter out self-collision (getCollisions may include the entity itself if it's in the system)
            const collisions = allCollisions.filter(collided => collided.id !== bullet.model.entity.id);
            
            if (isIdle || collisions.length > 0) {
                if (isIdle) {
                    console.log(`[GAMEWORLD] Bullet ${bullet.id} marked for removal: isIdle=true`);
                }
                if (collisions.length > 0) {
                    const collisionIds = collisions.map(c => {
                        const tank = Array.from(this.tanks.values()).find(t => t.model.entity.id === c.id);
                        const wall = this.walls.find(w => w.model.entity.id === c.id);
                        if (tank) return `tank_${tank.id}`;
                        if (wall) return `wall_${c.id}`;
                        return `unknown_${c.id}`;
                    });
                    console.log(`[GAMEWORLD] Bullet ${bullet.id} marked for removal: ${collisions.length} collisions with: ${collisionIds.join(', ')}`);
                }
                
                // Check if this is a grenade bullet (bulletNum === 4) and create explosion animation
                // Grenade explosions should happen whenever grenade bullet is removed (collision OR idle)
                // Grenade explosions happen BEFORE damage processing (like original handleExplosiveBullet)
                if (bullet.bulletNum === 4) {
                    // Always create grenade explosion for bulletNum === 4, regardless of isExplosiveBullet check
                    // The isExplosiveBullet check may fail but we still want the explosion animation
                    const explosionPoint = bullet.model.entity.calcCenter();
                    const explosionSize = ResolutionManager.GRENADE_EXPLOSION_SIZE + getRandomInt(-30, 30);
                    const explosionAngle = Math.random() * 2 * Math.PI - Math.PI; // Random angle between -PI and PI
                    this.grenadeExplosionsThisTick.push({
                        x: explosionPoint.x,
                        y: explosionPoint.y,
                        angle: explosionAngle,
                        size: explosionSize
                    });
                    console.log(`[GAMEWORLD] Grenade explosion created: bulletNum=${bullet.bulletNum}, x=${explosionPoint.x.toFixed(1)}, y=${explosionPoint.y.toFixed(1)}, size=${explosionSize}, reason=${isIdle ? 'idle' : 'collision'}`);
                }
                
                bulletsToRemove.push(bullet.id);
                
                // Handle bullet hits (only if collision occurred)
                if (collisions.length > 0) {
                    
                    for (const collided of collisions) {
                        // Skip collision with source tank - find source tank entity
                        const sourceTank = Array.from(this.tanks.values()).find(t => t.id === bullet.sourceId);
                        if (sourceTank && collided.id === sourceTank.model.entity.id) continue;
                        
                        // Check if hit a tank
                        const hitTank = Array.from(this.tanks.values()).find(t => t.model.entity.id === collided.id);
                        if (hitTank) {
                            hitTank.model.takeDamage(bullet.model);
                            if (hitTank.model.isDead()) {
                                // Add explosion animation info (like original AnimationMaker.playDeathAnimation)
                                // Note: original uses getRandomInt(-Math.PI, Math.PI) which returns integer angles
                                // But for smoother animation, we use continuous random angle
                                const explosionCenter = hitTank.model.entity.calcCenter();
                                const explosionAngle = Math.random() * 2 * Math.PI - Math.PI; // Random angle between -PI and PI
                                this.explosionsThisTick.push({
                                    x: explosionCenter.x,
                                    y: explosionCenter.y,
                                    angle: explosionAngle
                                });
                                
                                // Respawn tank
                                this.respawnTank(hitTank);
                            }
                        }
                        // Note: Wall collisions are handled by removal (bullet just disappears)
                    }
                }
            }
        }
        
        // Remove bullets that stopped or hit something
        for (const bulletId of bulletsToRemove) {
            const bullet = this.bullets.get(bulletId);
            if (bullet) {
                console.log(`[GAMEWORLD] Removing bullet ${bulletId}, remaining bullets: ${this.bullets.size - 1}`);
                this.collisionSystem.remove(bullet.model.entity);
                this.bullets.delete(bulletId);
            }
        }

        // Check item collisions
        this.checkItemCollisions();
        
        // Spawn bonus boxes periodically (like BonusSpawnManager.handle)
        this.updateBonusBoxSpawning(deltaTime);
    }
    
    private updateBonusBoxSpawning(deltaTime: number): void {
        this.ammoSpawnTimer += deltaTime;
        
        if (this.ammoSpawnTimer >= this.ammoSpawnInterval) {
            this.spawnRandomBox();
            
            this.ammoSpawnTimer = 0;
            
            // Increase interval for next spawn (like original)
            if (this.ammoSpawnInterval < GameWorld.MAX_AMMO_SPAWN_INTERVAL) {
                const increaseAmount = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000; // Random between 1000-5000
                this.ammoSpawnInterval += increaseAmount;
            }
        }
    }
    
    private getRandomBoxType(): Bonus {
        const res = Math.floor(Math.random() * 100) + 1;
        
        if (res < 40)
            return Bonus.bulMedium;
        else if (res < 70)
            return Bonus.bulSniper;
        else if (res < 85)
            return Bonus.bulHeavy;
        else
            return Bonus.bulGrenade;
    }
    
    private spawnRandomBox(): void {
        if (!this.pointSpawner) {
            return;
        }
        
        const boxType = this.getRandomBoxType();
        const spawnPoint = this.pointSpawner.getRandomSpawnPoint(
            ResolutionManager.BOX_SIZE,
            ResolutionManager.BOX_SIZE,
            0, SPAWN_GRIDS_LINES_AMOUNT - 1,
            0, SPAWN_GRIDS_COLUMNS_AMOUNT - 1
        );
        
        // Check for collisions (like original spawnRandomBox)
        // For simplicity, we'll just create the box - collision check would require creating entity first
        // In original, it retries up to RESPAWN_TRYS_AMOUNT times
        const item: ServerItem = {
            id: ModelIDTracker.collectibleItemId,
            x: spawnPoint.x,
            y: spawnPoint.y,
            type: boxType
        };
        this.items.set(item.id, item);
        console.log(`[GAMEWORLD] spawnRandomBox: created box item id=${item.id}, x=${item.x.toFixed(1)}, y=${item.y.toFixed(1)}, type=${item.type}, totalItems=${this.items.size}`);
    }

    private checkItemCollisions(): void {
        const itemsToRemove: number[] = [];
        
        for (const tank of this.tanks.values()) {
            // Check collisions with items using proper polygon collision (like original checkForBonusHits)
            // In original: collectibles = this._collisionDetector.hasCollision(element.model.entity)
            // We need to check collision between tank.entity and item's rectangular area
            for (const item of this.items.values()) {
                // Create temporary rectangular entity for item (like RectangularBonus in original)
                // item.x and item.y are the point (top-left corner before rotation, like points[0])
                const itemSize = item.type === Bonus.key ? ResolutionManager.KEY_SIZE : ResolutionManager.BOX_SIZE;
                const itemPoint = new Point(item.x, item.y);
                const itemRect = new RectangularEntity(itemPoint, itemSize, itemSize, 0, 0, item.id);
                
                // Check collision using SAT (like original CollisionDetector.hasCollision)
                const tankAxes = CollisionDetector.getAxes(tank.model.entity);
                const itemAxes = CollisionDetector.getAxes(itemRect);
                const hasCollision = CollisionDetector.hasCollision(tank.model.entity, itemRect, tankAxes, itemAxes);
                
                if (hasCollision) {
                    if (item.type === Bonus.key && tank.role === 'attacker') {
                        this.keysCollected++;
                        itemsToRemove.push(item.id);
                        console.log(`[GAMEWORLD] Key collected by attacker! Total keys: ${this.keysCollected}, current level: ${this.currentLevel}`);
                        
                        // Check if we should advance to next level (required keys collected on levels 1 or 2)
                        if (this.keysCollected === GameWorld.REQUIRED_KEYS_PER_LEVEL && this.currentLevel < 3) {
                            console.log(`[GAMEWORLD] ${GameWorld.REQUIRED_KEYS_PER_LEVEL} keys collected on level ${this.currentLevel} - advancing to level ${this.currentLevel + 1}`);
                            this.advanceToNextLevel();
                        }
                    } else if (item.type !== Bonus.key) {
                        // Bullet box - need to map Bonus enum to bulletNum
                        // Bonus: bulLight=0, bulMedium=1, bulHeavy=2, bulGrenade=3, bulSniper=4
                        // BulletNum: Light=0, Medium=1, Heavy=2, Sniper=3, Grenade=4
                        // So: bulGrenade (3) -> 4, bulSniper (4) -> 3, others are direct
                        let bulletNum = item.type;
                        if (item.type === Bonus.bulGrenade) {
                            bulletNum = 4; // Grenade bullet number
                        } else if (item.type === Bonus.bulSniper) {
                            bulletNum = 3; // Sniper bullet number
                        }
                        tank.model.takeBullet(bulletNum);
                        itemsToRemove.push(item.id);
                    }
                }
            }
        }
        
        for (const itemId of itemsToRemove) {
            this.items.delete(itemId);
        }
    }

    private respawnTank(tank: ServerTank): void {
        if (!this.pointSpawner) return;
        
        // Remove from collision system before respawn
        this.collisionSystem.remove(tank.model.entity);
        
        const config = tank.role === 'attacker' ? this.attackerConfig : this.defenderConfig;
        const minColumn = tank.role === 'attacker' ? 0 : Math.ceil(SPAWN_GRIDS_COLUMNS_AMOUNT / 2);
        const maxColumn = tank.role === 'attacker' ? Math.floor(SPAWN_GRIDS_COLUMNS_AMOUNT / 2) : SPAWN_GRIDS_COLUMNS_AMOUNT - 1;
        
        const spawnPoint = this.pointSpawner.getRandomSpawnPoint(
            ResolutionManager.getTankEntityWidth(config.hullNum),
            ResolutionManager.getTankEntityHeight(config.hullNum),
            0, SPAWN_GRIDS_LINES_AMOUNT - 1,
            minColumn, maxColumn
        );
        
        const angles = [0, 1.57, 3.14, 4.71];
        const angle = angles[getRandomInt(0, 3)];
        
        tank.model.entity.adjustPolygon(spawnPoint, 
            ResolutionManager.getTankEntityWidth(config.hullNum),
            ResolutionManager.getTankEntityHeight(config.hullNum),
            angle);
        tank.model.entity.velocity.x = 0;
        tank.model.entity.velocity.y = 0;
        tank.model.entity.angularVelocity = 0;
        
        // Reset health - recreate model with full health
        const tankParts = TankPartsCreator.create(config.hullNum, config.trackNum, config.turretNum, config.weaponNum);
        const newModel = new TankModel(tankParts, tank.model.entity);
        tank.model = newModel;
        
        // Re-insert into collision system
        this.collisionSystem.insert(tank.model.entity);
    }

    public getSnapshot(): any {
        const tankSnapshots = Array.from(this.tanks.values()).map(tank => ({
            id: tank.id,
            playerId: tank.playerId,
            role: tank.role,
            // Use points[0] (top-left corner before rotation) as in original TankMovementManager.hullUpdate
            x: tank.model.entity.points[0].x,
            y: tank.model.entity.points[0].y,
            angle: tank.model.entity.angle,
            turretAngle: tank.model.turretAngle,
            health: tank.model.health,
            maxHealth: tank.model.maxHealth,
            armor: tank.model.armor,
            maxArmor: tank.model.maxArmor,
            isIdle: tank.model.isIdle() // Add idle state to determine if track animation should stop
        }));

        const bulletSnapshots = Array.from(this.bullets.values()).map(bullet => ({
            id: bullet.id,
            // Use points[0] for bullets as well (as in original BulletMovementManager)
            x: bullet.model.entity.points[0].x,
            y: bullet.model.entity.points[0].y,
            angle: bullet.model.entity.angle,
            type: bullet.bulletNum // Include bullet type (num) for rendering
        }));
        if (bulletSnapshots.length > 0) {
            console.log(`[GAMEWORLD] getSnapshot: including ${bulletSnapshots.length} bullets:`, bulletSnapshots.map(b => ({ id: b.id, type: b.type, x: b.x.toFixed(1), y: b.y.toFixed(1) })));
        }

        const wallSnapshots = this.walls.map(wall => {
            const entity = wall.model.entity;
            return {
                id: entity.id,
                x: wall.originalPoint.x,
                y: wall.originalPoint.y,
                angle: entity.angle,
                materialNum: wall.materialNum,
                shapeNum: wall.shapeNum
            };
        });

        const itemSnapshots = Array.from(this.items.values()).map(item => ({
            id: item.id,
            x: item.x,
            y: item.y,
            type: item.type
        }));

        return {
            tanks: tankSnapshots,
            bullets: bulletSnapshots,
            walls: wallSnapshots,
            items: itemSnapshots,
            explosions: this.explosionsThisTick, // Include tank explosions from this tick
            grenadeExplosions: this.grenadeExplosionsThisTick, // Include grenade explosions from this tick
            keysCollected: this.keysCollected,
            currentLevel: this.currentLevel,
            timeElapsed: (Date.now() - this.startTime) / 1000
        };
    }

    public getTick(): number {
        return this.tick;
    }

    public checkGameEnd(): { winner: 'attacker' | 'defender'; reason: string } | null {
        const timeElapsed = (Date.now() - this.startTime) / 1000;
        
        // Time limit reached - defender wins
        if (timeElapsed >= this.FINISH_TIME / 1000) {
            return { winner: 'defender', reason: 'timeLimit' };
        }

        // Check if attacker collected required keys on level 3 - attacker wins
        if (this.keysCollected >= GameWorld.REQUIRED_KEYS_PER_LEVEL && this.currentLevel === 3) {
            return { winner: 'attacker', reason: 'keysCollected' };
        }

        return null;
    }
}
