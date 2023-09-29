import {FieldMap} from "../additionally/type";

export class ResolutionManager {
    private static resizeWidthCoeff: number = 1;
    private static resizeHeightCoeff: number = 1;
    private static readonly DEVELOPING_SCREEN_WIDTH: number = 1920;
    private static readonly DEVELOPING_SCREEN_HEIGHT: number = 1080;

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
    public static get EXPLOSION_SIZE(): number { return <number>ResolutionManager.fieldsX.EXPLOSION_SIZE }
    public static get ACCELERATION_EFFECT_INDENT_X(): number[] { return <number[]>ResolutionManager.fieldsX.ACCELERATION_EFFECT_INDENT_X }
    public static get KEY_SIZE(): number { return <number>ResolutionManager.fieldsX.KEY_SIZE }
    public static get BOX_SIZE(): number { return <number>ResolutionManager.fieldsX.BOX_SIZE }
    public static get HEALTH_BAR_HEIGHT(): number { return <number>ResolutionManager.fieldsY.HEALTH_BAR_HEIGHT }
    public static get ARMOR_BAR_HEIGHT(): number { return <number>ResolutionManager.fieldsY.ARMOR_BAR_HEIGHT }
    public static get HEALTH_ARMOR_BAR_INDENT_Y(): number { return <number>ResolutionManager.fieldsY.HEALTH_ARMOR_BAR_INDENT_Y }

    private static readonly fieldsX: FieldMap<number | number[]> = {
        BACKGROUND_SIZE: 115,
        WALL_WIDTH: [110, 55],
        HULL_WIDTH: [63, 67, 64, 53, 67, 67, 63, 57],
        TURRET_INDENT_X: [17, 21, 17, 12, 21, 21, 21, 17],
        TURRET_WIDTH: [35, 42, 30, 30, 24, 30, 35, 24],
        WEAPON_WIDTH: [39, 41, 33, 35, 42, 30, 35, 30],
        BULLET_WIDTH: [13, 18, 25, 26, 21],
        ACCELERATION_SIZE: 70,
        EXPLOSION_SIZE: 99,
        ACCELERATION_EFFECT_INDENT_X: [4, 11, 0, 0, 4, 4, 0, 0, 0],
        KEY_SIZE: 55,
        BOX_SIZE: 55,
    };
    private static readonly fieldsY: FieldMap<number | number[]> =  {
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
    public static resizeX(x: number): number { return Math.round(x * ResolutionManager.resizeWidthCoeff) }
    public static resizeY(y: number): number { return Math.round(y * ResolutionManager.resizeHeightCoeff) }
    public static undoResizeX(x: number): number { return Math.round(x / ResolutionManager.resizeWidthCoeff) }
    public static undoResizeY(y: number): number { return Math.round(y / ResolutionManager.resizeHeightCoeff) }
    public static setResolutionResizeCoeff(width: number, height: number){
        ResolutionManager.resizeWidthCoeff = width / ResolutionManager.DEVELOPING_SCREEN_WIDTH;
        ResolutionManager.resizeHeightCoeff = height / ResolutionManager.DEVELOPING_SCREEN_HEIGHT;

        ResolutionManager.resizeConstants();
    }
    private static resizeConstants(){
        for (const key in ResolutionManager.fieldsX) {
            const field = ResolutionManager.fieldsX[key];
            ResolutionManager.fieldsX[key] = Array.isArray(field)
                ? field.map(ResolutionManager.resizeX)
                : ResolutionManager.resizeX(field);
        }
        for (const key in ResolutionManager.fieldsY) {
            const field = ResolutionManager.fieldsY[key];
            ResolutionManager.fieldsY[key] = Array.isArray(field)
                ? field.map(ResolutionManager.resizeY)
                : ResolutionManager.resizeY(field);
        }
    }
}
export const ANGLE_EPSILON: number = Math.PI / 180;
export const MATERIAL: string[] = ['Grass', 'Ground', 'Sandstone'];
export const SHAPE: string[] = ['Rect', 'Square'];
export const WALL_MASS: number[][] = [[4, 2], [5.5, 2.5], [7, 3]];
export const RESISTANCE_COEFFICIENT: number[] = [0.55, 0.7, 0.85];
export const AIR_RESISTANCE_COEFFICIENT: number = 0.0000015;
export const BULLET_ANIMATION_SIZE_INCREASE_COEFF: number = 5;
export const GRAVITY_ACCELERATION: number = 0.01;
export const OBSTACLE_WALL_WIDTH_AMOUNT: number = 17;
export const OBSTACLE_WALL_HEIGHT_AMOUNT: number = 7;
export const WALL_GRID_COLUMNS_AMOUNT: number = 12;
export const WALL_GRID_LINES_AMOUNT: number = 6;
export const HEALTH_BAR_WIDTH_COEFF: number = 1.15;
export const HEALTH_BAR_HIGH_HP_COLOR: string = 'green';
export const HEALTH_BAR_MEDIUM_HP_COLOR: string = 'yellow';
export const HEALTH_BAR_LOW_HP_COLOR: string = 'red';

export const ARMOR_BAR_COLOR: string = 'blue';

export enum Bonus {
    kill,
    key,
    bulLight = 0,
    bulMedium = 1,
    bulHeavy = 2,
    bulGrenade = 3,
    bulSniper = 4
}

