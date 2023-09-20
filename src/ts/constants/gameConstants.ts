export class SizeConstants{
    private static resizeWidthCoeff: number = 1;
    private static resizeHeightCoeff: number = 1;
    private static readonly DEVELOPING_SCREEN_WIDTH: number = 1920;
    private static readonly DEVELOPING_SCREEN_HEIGHT: number = 1080;
    public static BACKGROUND_SIZE: number = 115;
    public static WALL_WIDTH: number[] = [101, 50];
    public static WALL_HEIGHT: number[] = [50, 50];
    public static TRACK_INDENT: number = 5;
    public static HULL_WIDTH: number[] = [76, 81, 77, 64, 81, 81, 76, 69];
    public static HULL_HEIGHT: number[] = [49, 62, 49, 41, 69, 56, 48, 41];
    public static TURRET_INDENT_X: number[] = [20, 25, 20, 15, 25, 25, 25, 20];
    public static TURRET_WIDTH: number[] = [43, 50, 36, 36, 29, 36, 43, 29];
    public static TURRET_HEIGHT: number[] = [36, 36, 22, 36, 29, 29, 36, 29];
    public static WEAPON_WIDTH: number[] = [47, 49, 40, 43, 50, 36, 43, 36];
    public static WEAPON_HEIGHT: number[] = [14, 10, 14, 7, 11, 16, 14, 14];
    public static BULLET_WIDTH: number[] = [12, 16, 23, 24, 19];
    public static BULLET_HEIGHT: number[] = [5, 8, 10, 6, 8];
    public static ACCELERATION_SIZE: number = 85;
    public static EXPLOSION_SIZE: number = 120;
    public static ACCELERATION_EFFECT_INDENT_X: number[] = [4, 10, 0, 0, 4, 4, 0, 0, 0];
    public static setResolutionResizeCoeff(){
        SizeConstants.resizeWidthCoeff = window.screen.width / SizeConstants.DEVELOPING_SCREEN_WIDTH;
        SizeConstants.resizeHeightCoeff = window.screen.height / SizeConstants.DEVELOPING_SCREEN_HEIGHT;

        SizeConstants.resizeConstants();
    }
    private static resizeWidthForCurrentResolution(width: number): number{
        return (width * SizeConstants.resizeWidthCoeff);
    }
    private static resizeHeightForCurrentResolution(height: number): number{
        return (height * SizeConstants.resizeHeightCoeff);
    }
    private static resizeConstants(){
        SizeConstants.BACKGROUND_SIZE = Math.round(SizeConstants.resizeWidthForCurrentResolution(SizeConstants.BACKGROUND_SIZE));
        for (let i = 0; i < SizeConstants.WALL_WIDTH.length; i++) {
            SizeConstants.WALL_WIDTH[i] = Math.round(SizeConstants.resizeWidthForCurrentResolution(SizeConstants.WALL_WIDTH[i]));
        }
        for (let i = 0; i < SizeConstants.WALL_HEIGHT.length; i++) {
            SizeConstants.WALL_HEIGHT[i] = Math.round(SizeConstants.resizeHeightForCurrentResolution(SizeConstants.WALL_HEIGHT[i]));
        }
        SizeConstants.TRACK_INDENT = Math.round(SizeConstants.resizeHeightForCurrentResolution(SizeConstants.TRACK_INDENT));
        for (let i = 0; i < SizeConstants.HULL_WIDTH.length; i++) {
            SizeConstants.HULL_WIDTH[i] = Math.round(SizeConstants.resizeWidthForCurrentResolution(SizeConstants.HULL_WIDTH[i]));
        }
        for (let i = 0; i < SizeConstants.HULL_HEIGHT.length; i++) {
            SizeConstants.HULL_HEIGHT[i] = Math.round(SizeConstants.resizeHeightForCurrentResolution(SizeConstants.HULL_HEIGHT[i]));
        }
        for (let i = 0; i < SizeConstants.TURRET_INDENT_X.length; i++) {
            SizeConstants.TURRET_INDENT_X[i] = Math.round(SizeConstants.resizeWidthForCurrentResolution(SizeConstants.TURRET_INDENT_X[i]));
        }
        for (let i = 0; i < SizeConstants.TURRET_WIDTH.length; i++) {
            SizeConstants.TURRET_WIDTH[i] = Math.round(SizeConstants.resizeWidthForCurrentResolution(SizeConstants.TURRET_WIDTH[i]));
        }
        for (let i = 0; i < SizeConstants.TURRET_HEIGHT.length; i++) {
            SizeConstants.TURRET_HEIGHT[i] = Math.round(SizeConstants.resizeHeightForCurrentResolution(SizeConstants.TURRET_HEIGHT[i]));
        }
        for (let i = 0; i < SizeConstants.WEAPON_WIDTH.length; i++) {
            SizeConstants.WEAPON_WIDTH[i] = Math.round(SizeConstants.resizeWidthForCurrentResolution(SizeConstants.WEAPON_WIDTH[i]));
        }
        for (let i = 0; i < SizeConstants.WEAPON_HEIGHT.length; i++) {
            SizeConstants.WEAPON_HEIGHT[i] = Math.round(SizeConstants.resizeHeightForCurrentResolution(SizeConstants.WEAPON_HEIGHT[i]));
        }
        for (let i = 0; i < SizeConstants.BULLET_WIDTH.length; i++) {
            SizeConstants.BULLET_WIDTH[i] = Math.round(SizeConstants.resizeWidthForCurrentResolution(SizeConstants.BULLET_WIDTH[i]));
        }
        for (let i = 0; i < SizeConstants.BULLET_HEIGHT.length; i++) {
            SizeConstants.BULLET_HEIGHT[i] = Math.round(SizeConstants.resizeHeightForCurrentResolution(SizeConstants.BULLET_HEIGHT[i]));
        }
        SizeConstants.ACCELERATION_SIZE = Math.round(SizeConstants.resizeWidthForCurrentResolution(SizeConstants.ACCELERATION_SIZE));
        SizeConstants.EXPLOSION_SIZE = Math.round(SizeConstants.resizeWidthForCurrentResolution(SizeConstants.EXPLOSION_SIZE));
        for (let i = 0; i < SizeConstants.ACCELERATION_EFFECT_INDENT_X.length; i++) {
            SizeConstants.ACCELERATION_EFFECT_INDENT_X[i] =
                SizeConstants.resizeWidthForCurrentResolution(SizeConstants.ACCELERATION_EFFECT_INDENT_X[i]);
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
