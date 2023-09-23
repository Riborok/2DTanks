export class ResolutionManager {
    private static resizeWidthCoeff: number = 1;
    private static resizeHeightCoeff: number = 1;
    private static readonly DEVELOPING_SCREEN_WIDTH: number = 1920;
    private static readonly DEVELOPING_SCREEN_HEIGHT: number = 1080;
    public static BACKGROUND_SIZE: number = 115;
    public static WALL_WIDTH: number[] = [100, 50];
    public static WALL_HEIGHT: number[] = [50, 50];
    public static TRACK_INDENT: number = 5;
    public static HULL_WIDTH: number[] = [57, 61, 58, 48, 61, 61, 57, 52];
    public static HULL_HEIGHT: number[] = [37, 47, 37, 31, 52, 42, 36, 31];
    public static TURRET_INDENT_X: number[] = [15, 19, 15, 11, 19, 19, 19, 15];
    public static TURRET_WIDTH: number[] = [32, 38, 27, 27, 22, 27, 32, 22];
    public static TURRET_HEIGHT: number[] = [27, 27, 17, 27, 22, 22, 27, 22];
    public static WEAPON_WIDTH: number[] = [35, 37, 30, 32, 38, 27, 32, 27];
    public static WEAPON_HEIGHT: number[] = [11, 8, 11, 5, 8, 12, 11, 11];
    public static BULLET_WIDTH: number[] = [12, 16, 23, 24, 19];
    public static BULLET_HEIGHT: number[] = [5, 8, 10, 6, 8];
    public static ACCELERATION_SIZE: number = 64;
    public static EXPLOSION_SIZE: number = 90;
    public static ACCELERATION_EFFECT_INDENT_X: number[] = [4, 10, 0, 0, 4, 4, 0, 0, 0];
    public static setResolutionResizeCoeff(width: number, height: number){
        ResolutionManager.resizeWidthCoeff = width / ResolutionManager.DEVELOPING_SCREEN_WIDTH;
        ResolutionManager.resizeHeightCoeff = height / ResolutionManager.DEVELOPING_SCREEN_HEIGHT;

        ResolutionManager.resizeConstants();
    }
    public static resizeX(x: number): number{
        return Math.round(x * ResolutionManager.resizeWidthCoeff);
    }
    public static resizeY(y: number): number{
        return Math.round(y * ResolutionManager.resizeHeightCoeff);
    }
    public static undoResizeX(x: number): number{
        return Math.round(x / ResolutionManager.resizeWidthCoeff);
    }
    public static undoResizeY(y: number): number{
        return Math.round(y / ResolutionManager.resizeHeightCoeff);
    }
    private static resizeConstants(){
        ResolutionManager.BACKGROUND_SIZE = ResolutionManager.resizeX(ResolutionManager.BACKGROUND_SIZE);
        for (let i = 0; i < ResolutionManager.WALL_WIDTH.length; i++) {
            ResolutionManager.WALL_WIDTH[i] = ResolutionManager.resizeX(ResolutionManager.WALL_WIDTH[i]);
        }
        for (let i = 0; i < ResolutionManager.WALL_HEIGHT.length; i++) {
            ResolutionManager.WALL_HEIGHT[i] = ResolutionManager.resizeY(ResolutionManager.WALL_HEIGHT[i]);
        }
        ResolutionManager.TRACK_INDENT = ResolutionManager.resizeY(ResolutionManager.TRACK_INDENT);
        for (let i = 0; i < ResolutionManager.HULL_WIDTH.length; i++) {
            ResolutionManager.HULL_WIDTH[i] = ResolutionManager.resizeX(ResolutionManager.HULL_WIDTH[i]);
        }
        for (let i = 0; i < ResolutionManager.HULL_HEIGHT.length; i++) {
            ResolutionManager.HULL_HEIGHT[i] = ResolutionManager.resizeY(ResolutionManager.HULL_HEIGHT[i]);
        }
        for (let i = 0; i < ResolutionManager.TURRET_INDENT_X.length; i++) {
            ResolutionManager.TURRET_INDENT_X[i] = ResolutionManager.resizeX(ResolutionManager.TURRET_INDENT_X[i]);
        }
        for (let i = 0; i < ResolutionManager.TURRET_WIDTH.length; i++) {
            ResolutionManager.TURRET_WIDTH[i] = ResolutionManager.resizeX(ResolutionManager.TURRET_WIDTH[i]);
        }
        for (let i = 0; i < ResolutionManager.TURRET_HEIGHT.length; i++) {
            ResolutionManager.TURRET_HEIGHT[i] = ResolutionManager.resizeY(ResolutionManager.TURRET_HEIGHT[i]);
        }
        for (let i = 0; i < ResolutionManager.WEAPON_WIDTH.length; i++) {
            ResolutionManager.WEAPON_WIDTH[i] = ResolutionManager.resizeX(ResolutionManager.WEAPON_WIDTH[i]);
        }
        for (let i = 0; i < ResolutionManager.WEAPON_HEIGHT.length; i++) {
            ResolutionManager.WEAPON_HEIGHT[i] = ResolutionManager.resizeY(ResolutionManager.WEAPON_HEIGHT[i]);
        }
        for (let i = 0; i < ResolutionManager.BULLET_WIDTH.length; i++) {
            ResolutionManager.BULLET_WIDTH[i] = ResolutionManager.resizeX(ResolutionManager.BULLET_WIDTH[i]);
        }
        for (let i = 0; i < ResolutionManager.BULLET_HEIGHT.length; i++) {
            ResolutionManager.BULLET_HEIGHT[i] = ResolutionManager.resizeY(ResolutionManager.BULLET_HEIGHT[i]);
        }
        ResolutionManager.ACCELERATION_SIZE = ResolutionManager.resizeX(ResolutionManager.ACCELERATION_SIZE);
        ResolutionManager.EXPLOSION_SIZE = ResolutionManager.resizeX(ResolutionManager.EXPLOSION_SIZE);
        for (let i = 0; i < ResolutionManager.ACCELERATION_EFFECT_INDENT_X.length; i++) {
            ResolutionManager.ACCELERATION_EFFECT_INDENT_X[i] =
                ResolutionManager.resizeX(ResolutionManager.ACCELERATION_EFFECT_INDENT_X[i]);
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

