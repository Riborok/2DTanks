import {FieldMap} from "../additionally/type";

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

export class ResolutionManager {
    /** Логическое поле сервера (совпадает с GameWorld на бэкенде) */
    public static readonly BASE_GAME_WIDTH: number = 1920;
    public static readonly BASE_GAME_HEIGHT: number = 1080;

    private static uniformScale: number = 1;
    private static offsetX: number = 0;
    private static offsetY: number = 0;

    // Store original (base) values that never change
    private static readonly baseFieldsX: FieldMap<number | number[]> = {
        BACKGROUND_SIZE: 115,
        WALL_WIDTH: [110, 55],
        HULL_WIDTH: [63, 67, 64, 53, 67, 67, 63, 57],
        TURRET_INDENT_X: [17, 21, 17, 12, 21, 21, 21, 17],
        TURRET_WIDTH: [35, 42, 30, 30, 24, 30, 35, 24],
        WEAPON_WIDTH: [39, 41, 33, 35, 42, 30, 35, 30],
        BULLET_WIDTH: [13, 18, 25, 26, 21],
        ACCELERATION_SIZE: 70,
        TANK_EXPLOSION_SIZE: 99,
        GRENADE_EXPLOSION_SIZE: 100,
        ACCELERATION_EFFECT_INDENT_X: [4, 11, 0, 0, 4, 4, 0, 0, 0],
        KEY_SIZE: 55,
        BOX_SIZE: 55,
    };
    private static readonly baseFieldsY: FieldMap<number | number[]> =  {
        WALL_HEIGHT: [55, 55],
        TRACK_INDENT: 5,
        HULL_HEIGHT: [41, 52, 41, 34, 57, 46, 40, 34],
        TURRET_HEIGHT: [30, 30, 19, 30, 24, 24, 30, 24],
        WEAPON_HEIGHT: [12, 9, 12, 6, 9, 13, 12, 12],
        BULLET_HEIGHT: [6, 9, 11, 7, 9],
        HEALTH_BAR_HEIGHT: 10,
        ARMOR_BAR_HEIGHT: 4,
        HEALTH_ARMOR_BAR_INDENT_Y: 3
    };

    // Cached scaled values (computed from base values using current resizeWidthCoeff)
    // Initialize by deep copying arrays from base values
    private static fieldsX: FieldMap<number | number[]> = ResolutionManager.deepCopyFields(ResolutionManager.baseFieldsX);
    private static fieldsY: FieldMap<number | number[]> = ResolutionManager.deepCopyFields(ResolutionManager.baseFieldsY);
    
    private static deepCopyFields(fields: FieldMap<number | number[]>): FieldMap<number | number[]> {
        const copy: FieldMap<number | number[]> = {};
        for (const key in fields) {
            const value = fields[key];
            copy[key] = Array.isArray(value) ? [...value] : value;
        }
        return copy;
    }

    public static get BACKGROUND_SIZE(): number { return <number>ResolutionManager.fieldsX.BACKGROUND_SIZE }
    public static get WALL_WIDTH(): number[] { return <number[]>ResolutionManager.fieldsX.WALL_WIDTH }
    public static get WALL_HEIGHT(): number[] { return <number[]>ResolutionManager.fieldsY.WALL_HEIGHT }
    public static get TRACK_INDENT(): number { return <number>ResolutionManager.fieldsY.TRACK_INDENT }
    public static get HULL_WIDTH(): number[] { return <number[]>ResolutionManager.fieldsX.HULL_WIDTH }
    public static get HULL_HEIGHT(): number[] { return <number[]>ResolutionManager.fieldsY.HULL_HEIGHT }
    public static get TURRET_INDENT_X(): number[] { return <number[]>ResolutionManager.fieldsX.TURRET_INDENT_X }
    public static get TURRET_WIDTH(): number[] { return <number[]>ResolutionManager.fieldsX.TURRET_WIDTH }
    public static get TURRET_HEIGHT(): number[] { return <number[]>ResolutionManager.fieldsY.TURRET_HEIGHT }
    public static get WEAPON_WIDTH(): number[] { return <number[]>ResolutionManager.fieldsX.WEAPON_WIDTH }
    public static get WEAPON_HEIGHT(): number[] { return <number[]>ResolutionManager.fieldsY.WEAPON_HEIGHT }
    public static get BULLET_WIDTH(): number[] { return <number[]>ResolutionManager.fieldsX.BULLET_WIDTH }
    public static get BULLET_HEIGHT(): number[] { return <number[]>ResolutionManager.fieldsY.BULLET_HEIGHT }
    public static get ACCELERATION_SIZE(): number { return <number>ResolutionManager.fieldsX.ACCELERATION_SIZE }
    public static get TANK_EXPLOSION_SIZE(): number { return <number>ResolutionManager.fieldsX.TANK_EXPLOSION_SIZE }
    public static get GRENADE_EXPLOSION_SIZE(): number { return <number>ResolutionManager.fieldsX.GRENADE_EXPLOSION_SIZE }
    public static get ACCELERATION_EFFECT_INDENT_X(): number[] { return <number[]>ResolutionManager.fieldsX.ACCELERATION_EFFECT_INDENT_X }
    public static get KEY_SIZE(): number { return <number>ResolutionManager.fieldsX.KEY_SIZE }
    public static get BOX_SIZE(): number { return <number>ResolutionManager.fieldsX.BOX_SIZE }
    public static get HEALTH_BAR_HEIGHT(): number { return <number>ResolutionManager.fieldsY.HEALTH_BAR_HEIGHT }
    public static get ARMOR_BAR_HEIGHT(): number { return <number>ResolutionManager.fieldsY.ARMOR_BAR_HEIGHT }
    public static get HEALTH_ARMOR_BAR_INDENT_Y(): number { return <number>ResolutionManager.fieldsY.HEALTH_ARMOR_BAR_INDENT_Y }
    public static getTankEntityWidth(num: number): number { return ResolutionManager.HULL_WIDTH[num] + ResolutionManager.TRACK_INDENT }
    public static getTankEntityHeight(num: number): number { return ResolutionManager.HULL_HEIGHT[num] + (ResolutionManager.TRACK_INDENT << 1) }

    /** Масштаб игрового мира на холсте (одинаково по X и Y, без искажений). */
    public static getUniformScale(): number {
        return ResolutionManager.uniformScale;
    }

    public static getOffsetX(): number { return ResolutionManager.offsetX }
    public static getOffsetY(): number { return ResolutionManager.offsetY }

    /** Размер области 1920×1080 в пикселях холста (после uniform scale). */
    public static getGameViewportWidthPx(): number {
        return ResolutionManager.BASE_GAME_WIDTH * ResolutionManager.uniformScale;
    }
    public static getGameViewportHeightPx(): number {
        return ResolutionManager.BASE_GAME_HEIGHT * ResolutionManager.uniformScale;
    }

    /** Координаты мира сервера → пиксели холста (с учётом letterbox). */
    public static worldToCanvasX(x: number): number {
        return Math.round(x * ResolutionManager.uniformScale + ResolutionManager.offsetX);
    }
    public static worldToCanvasY(y: number): number {
        return Math.round(y * ResolutionManager.uniformScale + ResolutionManager.offsetY);
    }

    /** Длина/размер в единицах мира сервера → пиксели на холсте. */
    public static scaleWorldLength(len: number): number {
        return Math.max(1, Math.round(len * ResolutionManager.uniformScale));
    }

    /**
     * Вызов при изменении размера холста: вписываем мир 1920×1080 с сохранением пропорций.
     */
    public static setViewport(canvasWidth: number, canvasHeight: number): void {
        const sx = canvasWidth / ResolutionManager.BASE_GAME_WIDTH;
        const sy = canvasHeight / ResolutionManager.BASE_GAME_HEIGHT;
        ResolutionManager.uniformScale = Math.min(sx, sy);
        ResolutionManager.offsetX = (canvasWidth - ResolutionManager.BASE_GAME_WIDTH * ResolutionManager.uniformScale) / 2;
        ResolutionManager.offsetY = (canvasHeight - ResolutionManager.BASE_GAME_HEIGHT * ResolutionManager.uniformScale) / 2;
        ResolutionManager.resizeConstants();
    }

    private static scaleDesignValue(v: number): number {
        return Math.round(v * ResolutionManager.uniformScale);
    }

    private static resizeConstants(): void {
        for (const key in ResolutionManager.baseFieldsX) {
            const baseField = ResolutionManager.baseFieldsX[key];
            ResolutionManager.fieldsX[key] = Array.isArray(baseField)
                ? baseField.map(val => ResolutionManager.scaleDesignValue(val))
                : ResolutionManager.scaleDesignValue(baseField);
        }
        for (const key in ResolutionManager.baseFieldsY) {
            const baseField = ResolutionManager.baseFieldsY[key];
            ResolutionManager.fieldsY[key] = Array.isArray(baseField)
                ? baseField.map(val => ResolutionManager.scaleDesignValue(val))
                : ResolutionManager.scaleDesignValue(baseField);
        }
    }
}
export const ANGLE_EPSILON: number = Math.PI / 180;
export const MATERIAL: string[] = ['Grass', 'Ground', 'Sandstone'];
export const SHAPE: string[] = ['Rect', 'Square'];
export const WALL_MASS: number[][] = [[4, 2], [5.5, 2.5], [7, 3]];
export const AIR_RESISTANCE_COEFFICIENT: number = 0.0000015;
export const BULLET_ANIMATION_SIZE_INCREASE_COEFF: number = 5;
export const GRAVITY_ACCELERATION: number = 0.01;
export const OBSTACLE_WALL_WIDTH_AMOUNT: number = 17;
export const OBSTACLE_WALL_HEIGHT_AMOUNT: number = 7;
export const WALL_GRID_COLUMNS_AMOUNT: number = 12;
export const WALL_GRID_LINES_AMOUNT: number = 6;
export const SPAWN_GRIDS_LINES_AMOUNT: number = WALL_GRID_LINES_AMOUNT - 1;
export const SPAWN_GRIDS_COLUMNS_AMOUNT: number = WALL_GRID_COLUMNS_AMOUNT - 1;
export const HEALTH_BAR_WIDTH_COEFF: number = 1.15;
export const HEALTH_BAR_HIGH_HP_COLOR: string = 'green';
export const HEALTH_BAR_MEDIUM_HP_COLOR: string = 'yellow';
export const HEALTH_BAR_LOW_HP_COLOR: string = 'red';
export const ARMOR_BAR_COLOR: string = 'blue';

export enum Bonus {
    bulLight = 0,
    bulMedium = 1,
    bulHeavy = 2,
    bulGrenade = 3,
    bulSniper = 4,
    key = 5,
    perkShield = 6
}
