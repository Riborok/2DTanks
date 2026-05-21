export const ANGLE_EPSILON: number = Math.PI / 180;
export const MATERIAL: string[] = ['Grass', 'Ground', 'Sandstone'];
export const SHAPE: string[] = ['Rect', 'Square'];
export const WALL_MASS: number[][] = [[4, 2], [5.5, 2.5], [7, 3]];
/**
 * Масса только разрушаемых ящиков (shape 1, hasMass) в deathmatch.
 * Ниже минимальной массы танка (~0.81 сумма hull+turret+weapon), чтобы тяжёлый танк заметно лучше сдвигал ящик, лёгкий — с большей отдачей (invMass в CollisionResolver).
 * Индекс = materialNum стены арены (0…2), как у WALL_MASS.
 */
export const CRATE_DYNAMIC_MASS: number[] = [0.42, 0.5, 0.58];

export function dynamicCrateMass(materialNum: number): number {
    const idx = Math.max(0, Math.min(CRATE_DYNAMIC_MASS.length - 1, materialNum));
    return CRATE_DYNAMIC_MASS[idx];
}
/**
 * Доля бокового скольжения гусениц по покрытию (не «сила дрифта» в аркадном смысле).
 * Индекс = backgroundMaterial: 0 трава, 1 грунт, 2 песчаник.
 * Чем выше — тем слабее выравнивание с корпусом (лёгкий занос); трава > грунт > песчаник.
 */
export const TRACK_SLIP_BY_MATERIAL: number[] = [0.08, 0.05, 0.025];
export const AIR_RESISTANCE_COEFFICIENT: number = 0.0000022;
export const BULLET_ANIMATION_SIZE_INCREASE_COEFF: number = 5;
export const GRAVITY_ACCELERATION: number = 0.01;
/** Делитель в формулах сил и множитель для согласования сдвига/поворота с variable deltaTime (мс) */
export const PHYSICS_REFERENCE_DELTA_MS: number = 17;
export const OBSTACLE_WALL_WIDTH_AMOUNT: number = 17;
export const OBSTACLE_WALL_HEIGHT_AMOUNT: number = 7;
export const WALL_GRID_COLUMNS_AMOUNT: number = 12;
export const WALL_GRID_LINES_AMOUNT: number = 6;
export const SPAWN_GRIDS_LINES_AMOUNT: number = WALL_GRID_LINES_AMOUNT - 1;
export const SPAWN_GRIDS_COLUMNS_AMOUNT: number = WALL_GRID_COLUMNS_AMOUNT - 1;

export enum Bonus {
    bulLight = 0,
    bulMedium = 1,
    bulHeavy = 2,
    bulGrenade = 3,
    bulSniper = 4,
    key = 5,
    /** Перк: неуязвимость к урону от снарядов на несколько секунд */
    perkShield = 6
}

export const GAMEPLAY_CONFIG = {
    COMMON: {
        DEFAULT_BULLET_NUM: 4, // Base ammo: 0 light, 1 medium, 2 heavy, 3 sniper, 4 grenade
        SERVER_TICK_RATE: 60, // Server simulation Hz
        RESISTANCE_COEFFICIENT: [0.6, 0.76, 0.9], // Surface resistance: grass, ground, sandstone

        INITIAL_AMMO_SPAWN_INTERVAL_MS: 5000, // First bonus spawn delay
        MAX_AMMO_SPAWN_INTERVAL_MS: 60000, // Max bonus spawn delay
        AMMO_SPAWN_INTERVAL_INCREASE_MIN_MS: 1000, // Min delay increase per spawn
        AMMO_SPAWN_INTERVAL_INCREASE_MAX_MS: 5000, // Max delay increase per spawn
        SHIELD_DURATION_MS: 5000, // Shield pickup duration

        DESTRUCTIBLE_CRATE_MAX_HP: 90, // Crate hit points
        DESTRUCTIBLE_CRATE_SPAWN_TRIES: 30 // Spawn placement attempts
    },

    ARENA: {
        MATCH_DURATION_SEC: 30, // Round duration
        MAX_PLAYERS: 5, // Max arena players
        DESTRUCTIBLE_CRATE_COUNT: 10, // Initial crate count
        BONUS_ROLL: {
            SHIELD_MAX: 8, // Roll <= value
            MEDIUM_MAX: 44, // Roll <= value
            SNIPER_MAX: 71, // Roll <= value
            HEAVY_MAX: 86 // Roll <= value
        }
    },

    MAZE: {
        MATCH_DURATION_SEC: 30, // Match duration
        SOLO_MAX_PLAYERS: 1, // Solo test players
        STANDARD_MAX_PLAYERS: 2, // 1v1 players
        REQUIRED_KEYS_PER_LEVEL: 1, // Keys needed per level
        DESTRUCTIBLE_CRATE_COUNT: 6, // Initial crate count
        INITIAL_BACKGROUND_MATERIAL: 1, // Initial floor material
        INITIAL_WALL_MATERIAL: 2, // Initial wall material
        LEVEL_MATERIALS: [
            { background: 1, wall: 2 },
            { background: 2, wall: 1 },
            { background: 0, wall: 0 }
        ], // Per-level materials
        BONUS_ROLL: {
            SHIELD_MAX: 42, // Roll <= value
            MEDIUM_MAX: 62, // Roll <= value
            SNIPER_MAX: 80, // Roll <= value
            HEAVY_MAX: 92 // Roll <= value
        }
    }
} as const;

export const DEFAULT_BULLET_NUM = GAMEPLAY_CONFIG.COMMON.DEFAULT_BULLET_NUM;
export const RESISTANCE_COEFFICIENT = GAMEPLAY_CONFIG.COMMON.RESISTANCE_COEFFICIENT;
export const SHIELD_DURATION_MS = GAMEPLAY_CONFIG.COMMON.SHIELD_DURATION_MS;

// Resolution constants (based on 1920px width)
export class ResolutionManager {
    public static readonly DEVELOPING_SCREEN_WIDTH: number = 1920;
    
    public static readonly WALL_WIDTH: number[] = [110, 55];
    public static readonly WALL_HEIGHT: number[] = [55, 55];
    public static readonly TRACK_INDENT: number = 5;
    public static readonly HULL_WIDTH: number[] = [63, 67, 64, 53, 67, 67, 63, 57];
    public static readonly HULL_HEIGHT: number[] = [41, 52, 41, 34, 57, 46, 40, 34];
    public static readonly TURRET_INDENT_X: number[] = [17, 21, 17, 12, 21, 21, 21, 17];
    public static readonly TURRET_WIDTH: number[] = [35, 42, 30, 30, 24, 30, 35, 24];
    public static readonly TURRET_HEIGHT: number[] = [30, 30, 19, 30, 24, 24, 30, 24];
    public static readonly WEAPON_WIDTH: number[] = [39, 41, 33, 35, 42, 30, 35, 30];
    public static readonly WEAPON_HEIGHT: number[] = [12, 9, 12, 6, 9, 13, 12, 12];
    public static readonly BULLET_WIDTH: number[] = [13, 18, 25, 26, 21];
    public static readonly BULLET_HEIGHT: number[] = [6, 9, 11, 7, 9];
    public static readonly GRENADE_EXPLOSION_SIZE: number = 100;
    public static readonly TANK_EXPLOSION_SIZE: number = 99;
    public static readonly KEY_SIZE: number = 55;
    public static readonly BOX_SIZE: number = 55;
    
    public static getTankEntityWidth(num: number): number {
        return ResolutionManager.HULL_WIDTH[num] + ResolutionManager.TRACK_INDENT;
    }
    
    public static getTankEntityHeight(num: number): number {
        return ResolutionManager.HULL_HEIGHT[num] + (ResolutionManager.TRACK_INDENT << 1);
    }
}


