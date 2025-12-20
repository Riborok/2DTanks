import {Point} from "../../geometry/Point";
import {ServerWall} from "./ObstacleCreator";
import {ObstacleCreator} from "./ObstacleCreator";
import {ResolutionManager, WALL_GRID_COLUMNS_AMOUNT, WALL_GRID_LINES_AMOUNT} from "../../constants/gameConstants";
import {PointRotator} from "../../geometry/PointRotator";

type GridPack = {
    GRID_COLUMNS_AMOUNT: number,
    GRID_LINES_AMOUNT: number,
    GRID_COLUMNS: number[],
    GRID_LINES: number[]
}

export class MazeCreator {
    private constructor() { }
    
    private static calcGridPoints(point: Point): GridPack{
        const gridPack: GridPack = {
            GRID_COLUMNS_AMOUNT: WALL_GRID_COLUMNS_AMOUNT,
            GRID_LINES_AMOUNT: WALL_GRID_LINES_AMOUNT,
            GRID_COLUMNS: [],
            GRID_LINES: []
        };
        const sectionWidth = ResolutionManager.WALL_WIDTH[0] * 3 / 2;

        for (let i = 0; i < gridPack.GRID_COLUMNS_AMOUNT; i++){
            gridPack.GRID_COLUMNS[i] = point.x + i * sectionWidth;
        }

        for (let i = 0; i < gridPack.GRID_LINES_AMOUNT; i++){
            gridPack.GRID_LINES[i] = point.y + i * sectionWidth;
        }

        return gridPack;
    }
    
    private static makeHorWallLine(point: Point, wallAmount: number,
                                   isFirstSquare: boolean, isLastSquare: boolean,
                                   wallsArray: Array<ServerWall>, gridPack: GridPack, wallMaterial: number){
        if (point.y === gridPack.GRID_LINES[0] || point.y === gridPack.GRID_LINES[gridPack.GRID_LINES.length - 1])
            throw new Error('Horizontal wall line was made on the obstacle!');

        if (point.x !== gridPack.GRID_COLUMNS[0] && isFirstSquare) {
            wallsArray.push(ObstacleCreator.createWall(point, 0, wallMaterial, 1, false));
        }

        let newPoint = new Point(point.x + ResolutionManager.WALL_WIDTH[1], point.y);
        for (let i = 0; i < wallAmount; i++) {
            if (newPoint.x >= gridPack.GRID_COLUMNS[gridPack.GRID_COLUMNS.length - 1])
                throw new Error('Horizontal wall line was made on the obstacle!');

            wallsArray.push(ObstacleCreator.createWall(
                    new Point(newPoint.x, newPoint.y),
                    0, wallMaterial, 0, false
                )
            );
            newPoint = new Point(newPoint.x + ResolutionManager.WALL_WIDTH[0], point.y);

            if (i !== wallAmount - 1) {
                wallsArray.push(ObstacleCreator.createWall(
                        new Point(newPoint.x, newPoint.y),
                        0, wallMaterial, 1, false
                    )
                );
                newPoint = new Point(newPoint.x + ResolutionManager.WALL_WIDTH[1], point.y);
            }
            else if (point.x + wallAmount * (ResolutionManager.WALL_WIDTH[0] + ResolutionManager.WALL_WIDTH[1]) <
                gridPack.GRID_COLUMNS[gridPack.GRID_COLUMNS.length - 1] && isLastSquare) {
                wallsArray.push(ObstacleCreator.createWall(
                        new Point(newPoint.x, newPoint.y),
                        0, wallMaterial, 1, false
                    )
                );
            }
        }
    }
    
    private static makeVertWallLine(point: Point, wallAmount: number,
                                    isFirstSquare: boolean, isLastSquare: boolean,
                                    wallsArray: Array<ServerWall>, gridPack: GridPack, wallMaterial: number){
        if (point.x === gridPack.GRID_COLUMNS[0] || point.x === gridPack.GRID_COLUMNS[gridPack.GRID_COLUMNS.length - 1])
            throw new Error('Vertical wall line was made on the obstacle!');

        let visibleMainPoint = new Point(point.x, point.y);
        if (visibleMainPoint.y !== gridPack.GRID_LINES[0] && isFirstSquare) {
            wallsArray.push(ObstacleCreator.createWall(visibleMainPoint, 0, wallMaterial, 1, false));
        }
        visibleMainPoint = new Point(visibleMainPoint.x, visibleMainPoint.y + ResolutionManager.WALL_HEIGHT[1]);

        let actualMainPoint = new Point(visibleMainPoint.x + ResolutionManager.WALL_HEIGHT[0], visibleMainPoint.y);
        PointRotator.rotatePointAroundTarget(
            actualMainPoint,
            new Point(
                actualMainPoint.x - ResolutionManager.WALL_HEIGHT[0] / 2,
                actualMainPoint.y + ResolutionManager.WALL_WIDTH[0] / 2
            ),
            Math.sin(-Math.PI / 2),
            Math.cos(-Math.PI / 2),
        );

        for (let i = 0; i < wallAmount; i++) {
            if (visibleMainPoint.y >= gridPack.GRID_LINES[gridPack.GRID_LINES.length - 1])
                throw new Error('Vertical wall line was made on the obstacle!');

            wallsArray.push(ObstacleCreator.createWall(
                    new Point(actualMainPoint.x, actualMainPoint.y),
                    Math.PI / 2, wallMaterial, 0, false
                )
            );
            actualMainPoint = new Point(actualMainPoint.x, actualMainPoint.y + ResolutionManager.WALL_WIDTH[0]);
            visibleMainPoint = new Point(visibleMainPoint.x, visibleMainPoint.y + ResolutionManager.WALL_WIDTH[0]);

            if (i !== wallAmount - 1) {
                wallsArray.push(ObstacleCreator.createWall(
                        new Point(visibleMainPoint.x, visibleMainPoint.y),
                        0, wallMaterial, 1, false
                    )
                );
                visibleMainPoint = new Point(visibleMainPoint.x, visibleMainPoint.y + ResolutionManager.WALL_HEIGHT[1]);
                actualMainPoint = new Point(actualMainPoint.x, actualMainPoint.y + ResolutionManager.WALL_HEIGHT[1]);
            }
            else if (point.y + wallAmount * (ResolutionManager.WALL_WIDTH[0] + ResolutionManager.WALL_HEIGHT[1]) <
                gridPack.GRID_LINES[gridPack.GRID_LINES.length - 1] && isLastSquare) {
                wallsArray.push(ObstacleCreator.createWall(
                        new Point(visibleMainPoint.x, visibleMainPoint.y),
                        0, wallMaterial, 1, false
                    )
                );
            }
        }
    }
    
    public static createMazeLvl1(wallMaterial: number, point: Point): ServerWall[]{
        const gridPack: GridPack = MazeCreator.calcGridPoints(point);
        const wallsArray = new Array<ServerWall>();

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[1], gridPack.GRID_LINES[1]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[0], gridPack.GRID_LINES[2]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[1], gridPack.GRID_LINES[3]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[1], gridPack.GRID_LINES[4]), 1,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[2], gridPack.GRID_LINES[4]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[2], gridPack.GRID_LINES[0]), 3,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[2], gridPack.GRID_LINES[3]), 1,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[3], gridPack.GRID_LINES[1]), 3,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[3], gridPack.GRID_LINES[2]), 2,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[5], gridPack.GRID_LINES[2]), 2,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[5], gridPack.GRID_LINES[3]), 1,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[4], gridPack.GRID_LINES[4]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[4], gridPack.GRID_LINES[3]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[5], gridPack.GRID_LINES[0]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[4], gridPack.GRID_LINES[1]), 3,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[6], gridPack.GRID_LINES[1]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[6], gridPack.GRID_LINES[4]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[8], gridPack.GRID_LINES[1]), 2,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[7], gridPack.GRID_LINES[2]), 2,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[7], gridPack.GRID_LINES[2]), 2,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[9], gridPack.GRID_LINES[2]), 1,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[9], gridPack.GRID_LINES[3]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[8], gridPack.GRID_LINES[3]), 2,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[8], gridPack.GRID_LINES[4]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[9], gridPack.GRID_LINES[1]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[10], gridPack.GRID_LINES[1]), 1,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[10], gridPack.GRID_LINES[2]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[10], gridPack.GRID_LINES[4]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        return wallsArray;
    }
    
    public static createMazeLvl2(wallMaterial: number, point: Point): ServerWall[] {
        const gridPack: GridPack = MazeCreator.calcGridPoints(point);
        const wallsArray = new Array<ServerWall>();

        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[0], gridPack.GRID_LINES[1]), 2,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[2], gridPack.GRID_LINES[1]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[3], gridPack.GRID_LINES[0]), 2,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[3], gridPack.GRID_LINES[2]), 2,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[5], gridPack.GRID_LINES[1]), 2,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[5], gridPack.GRID_LINES[1]), 1,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[5], gridPack.GRID_LINES[3]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[4], gridPack.GRID_LINES[0]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[0], gridPack.GRID_LINES[4]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[1], gridPack.GRID_LINES[2]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[1], gridPack.GRID_LINES[3]), 3,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[2], gridPack.GRID_LINES[3]), 2,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[7], gridPack.GRID_LINES[0]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[6], gridPack.GRID_LINES[4]), 1,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[3], gridPack.GRID_LINES[4]), 5,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[7], gridPack.GRID_LINES[2]), 2,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[6], gridPack.GRID_LINES[2]), 2,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[8], gridPack.GRID_LINES[1]), 2,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[9], gridPack.GRID_LINES[0]), 3,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[9], gridPack.GRID_LINES[3]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[10], gridPack.GRID_LINES[1]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[10], gridPack.GRID_LINES[2]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[9], gridPack.GRID_LINES[4]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[9], gridPack.GRID_LINES[4]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        return wallsArray;
    }
    
    public static createMazeLvl3(wallMaterial: number, point: Point): ServerWall[] {
        const gridPack: GridPack = MazeCreator.calcGridPoints(point);
        const wallsArray = new Array<ServerWall>();

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[1], gridPack.GRID_LINES[0]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[0], gridPack.GRID_LINES[2]), 2,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[0], gridPack.GRID_LINES[4]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[3], gridPack.GRID_LINES[0]), 3,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[2], gridPack.GRID_LINES[1]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[1], gridPack.GRID_LINES[3]), 2,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[2], gridPack.GRID_LINES[4]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[4], gridPack.GRID_LINES[3]), 2,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[3], gridPack.GRID_LINES[4]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[6], gridPack.GRID_LINES[0]), 3,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[4], gridPack.GRID_LINES[1]), 2,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[6], gridPack.GRID_LINES[2]), 3,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[7], gridPack.GRID_LINES[1]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[9], gridPack.GRID_LINES[1]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[9], gridPack.GRID_LINES[1]), 1,
            false, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[8], gridPack.GRID_LINES[0]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[6], gridPack.GRID_LINES[4]), 1,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[5], gridPack.GRID_LINES[4]), 3,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[5], gridPack.GRID_LINES[2]), 2,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[4], gridPack.GRID_LINES[2]), 1,
            true, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[7], gridPack.GRID_LINES[3]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeVertWallLine(new Point(gridPack.GRID_COLUMNS[9], gridPack.GRID_LINES[3]), 2,
            false, true, wallsArray, gridPack, wallMaterial);
        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[8], gridPack.GRID_LINES[3]), 2,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[10], gridPack.GRID_LINES[2]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        MazeCreator.makeHorWallLine(new Point(gridPack.GRID_COLUMNS[10], gridPack.GRID_LINES[4]), 1,
            true, true, wallsArray, gridPack, wallMaterial);

        return wallsArray;
    }
}


