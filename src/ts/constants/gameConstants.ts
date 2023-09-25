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

    private static readonly fieldsX: FieldMap<number | number[]> = {
        BACKGROUND_SIZE: 115,
        WALL_WIDTH: [100, 50],
        HULL_WIDTH: [57, 61, 58, 48, 61, 61, 57, 52],
        TURRET_INDENT_X: [15, 19, 15, 11, 19, 19, 19, 15],
        TURRET_WIDTH: [32, 38, 27, 27, 22, 27, 32, 22],
        WEAPON_WIDTH: [35, 37, 30, 32, 38, 27, 32, 27],
        BULLET_WIDTH: [12, 16, 23, 24, 19],
        ACCELERATION_SIZE: 64,
        EXPLOSION_SIZE: 90,
        ACCELERATION_EFFECT_INDENT_X: [4, 10, 0, 0, 4, 4, 0, 0, 0],
        KEY_SIZE: 50,
        BOX_SIZE: 50,
    };
    private static readonly fieldsY: FieldMap<number | number[]> =  {
        WALL_HEIGHT: [50, 50],
        TRACK_INDENT: 4,
        HULL_HEIGHT: [37, 47, 37, 31, 52, 42, 36, 31],
        TURRET_HEIGHT: [27, 27, 17, 27, 22, 22, 27, 22],
        WEAPON_HEIGHT: [11, 8, 11, 5, 8, 12, 11, 11],
        BULLET_HEIGHT: [5, 8, 10, 6, 8],
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

export enum Bonus {
    kill = 0,
    key = 1,
}

