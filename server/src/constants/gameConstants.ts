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
export const SPAWN_GRIDS_LINES_AMOUNT: number = WALL_GRID_LINES_AMOUNT - 1;
export const SPAWN_GRIDS_COLUMNS_AMOUNT: number = WALL_GRID_COLUMNS_AMOUNT - 1;

export enum Bonus {
    bulLight = 0,
    bulMedium = 1,
    bulHeavy = 2,
    bulGrenade = 3,
    bulSniper = 4,
    key = 5
}

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


