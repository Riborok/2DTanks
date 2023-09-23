import {Point} from "../../geometry/Point";
import {WallElement} from "../elements/WallElement";
import {ObstacleCreator} from "./IObstacleCreator";
import {HandlingManager} from "../managers/handling managers/HandlingManager";
import {WallMovementManager} from "../managers/movement managers/WallMovementManager";
import {
    OBSTACLE_WALL_HEIGHT_AMOUNT,
    OBSTACLE_WALL_WIDTH_AMOUNT,
    ResolutionManager
} from "../../constants/gameConstants";
import {PointRotator} from "../../geometry/PointRotator";
import * as constants from "constants";

export class MazeCreator {
    public static GRID_COLUMNS_AMOUNT: number = 12;
    public static GRID_LINES_AMOUNT: number = 6;
    public static GRID_COLUMNS: number[] = [];
    public static GRID_LINES: number[] = [];
    private static _wallHandlingManagers: HandlingManager<WallElement, WallMovementManager>;
    private static _wallMaterialNum: number;
    public static calcGridPoints(point: Point){
        const sectionWidth = ResolutionManager.WALL_WIDTH[0] * 3 / 2;

        for (let i = 0; i < MazeCreator.GRID_COLUMNS_AMOUNT; i++){
            this.GRID_COLUMNS[i] = point.x + i * sectionWidth;
        }

        for (let i = 0; i < MazeCreator.GRID_LINES_AMOUNT; i++){
            this.GRID_LINES[i] = point.y + i * sectionWidth;
        }
    }
    public static createMaze(wallHandlingManager: HandlingManager<WallElement, WallMovementManager>,
                             wallMaterialNum: number){
        MazeCreator._wallHandlingManagers = wallHandlingManager;
        MazeCreator._wallMaterialNum = wallMaterialNum;

        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[1], MazeCreator.GRID_LINES[1]), 1,
            true, true);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[0], MazeCreator.GRID_LINES[2]), 1,
            true, false);

        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[1], MazeCreator.GRID_LINES[3]), 1,
            true, true);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[1], MazeCreator.GRID_LINES[4]), 1,
            false, true);
        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[2], MazeCreator.GRID_LINES[4]), 1,
            false, true);

        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[2], MazeCreator.GRID_LINES[0]), 3,
            true, true);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[2], MazeCreator.GRID_LINES[3]), 1,
            false, false);
        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[3], MazeCreator.GRID_LINES[1]), 3,
            true, true);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[3], MazeCreator.GRID_LINES[2]), 2,
            false, true);
        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[5], MazeCreator.GRID_LINES[2]), 2,
            false, true);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[5], MazeCreator.GRID_LINES[3]), 1,
            false, true);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[4], MazeCreator.GRID_LINES[4]), 1,
            true, false);
        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[4], MazeCreator.GRID_LINES[3]), 1,
            true, false);

        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[5], MazeCreator.GRID_LINES[0]), 1,
            true, false);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[4], MazeCreator.GRID_LINES[1]), 3,
            true, true);
        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[6], MazeCreator.GRID_LINES[1]), 1,
            false, true);

        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[6], MazeCreator.GRID_LINES[4]), 1,
            true, true);

        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[8], MazeCreator.GRID_LINES[1]), 2,
            true, false);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[7], MazeCreator.GRID_LINES[2]), 2,
            true, true);
        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[7], MazeCreator.GRID_LINES[2]), 2,
            false, true);
        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[9], MazeCreator.GRID_LINES[2]), 1,
            false, true);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[9], MazeCreator.GRID_LINES[3]), 1,
            false, true);

        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[8], MazeCreator.GRID_LINES[3]), 2,
            true, true);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[8], MazeCreator.GRID_LINES[4]), 1,
            false, true);

        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[9], MazeCreator.GRID_LINES[1]), 1,
            true, true);
        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[10], MazeCreator.GRID_LINES[1]), 1,
            false, true);
        MazeCreator.makeHorWallLine(new Point(MazeCreator.GRID_COLUMNS[10], MazeCreator.GRID_LINES[2]), 1,
            false, true);

        MazeCreator.makeVertWallLine(new Point(MazeCreator.GRID_COLUMNS[10], MazeCreator.GRID_LINES[4]), 1,
            true, true);
    }
    private static makeHorWallLine(point: Point, wallAmount: number, isFirstSquare: boolean, isLastSquare: boolean){
        if (point.y === MazeCreator.GRID_LINES[0] || point.y === MazeCreator.GRID_LINES[MazeCreator.GRID_LINES.length - 1])
            throw new Error('Horizontal wall line was made on the obstacle!');

        const arr = new Array<WallElement>();

        if (point.x !== this.GRID_COLUMNS[0] && isFirstSquare) {
            arr.push(ObstacleCreator.createWall(point, 0, MazeCreator._wallMaterialNum, 1, false));
        }

        let newPoint = new Point(point.x + ResolutionManager.WALL_WIDTH[1], point.y)
        for (let i = 0; i < wallAmount; i++) {
            if (newPoint.x >= MazeCreator.GRID_COLUMNS[MazeCreator.GRID_COLUMNS.length - 1])
                throw new Error('Horizontal wall line was made on the obstacle!');

            arr.push(ObstacleCreator.createWall(
                    new Point(newPoint.x, newPoint.y),
                    0, MazeCreator._wallMaterialNum, 0, false
                )
            );
            newPoint = new Point(newPoint.x + ResolutionManager.WALL_WIDTH[0], point.y);

            if (i !== wallAmount - 1) {
                arr.push(ObstacleCreator.createWall(
                        new Point(newPoint.x, newPoint.y),
                        0, MazeCreator._wallMaterialNum, 1, false
                    )
                );
                newPoint = new Point(newPoint.x + ResolutionManager.WALL_WIDTH[1], point.y);
            }
            else if (point.x + wallAmount * (ResolutionManager.WALL_WIDTH[0] + ResolutionManager.WALL_WIDTH[1]) <
                MazeCreator.GRID_COLUMNS[MazeCreator.GRID_COLUMNS.length - 1] && isLastSquare) {
                    arr.push(ObstacleCreator.createWall(
                            new Point(newPoint.x, newPoint.y),
                            0, MazeCreator._wallMaterialNum, 1, false
                        )
                    );
            }
        }

        this._wallHandlingManagers.add(arr);
    }
    private static makeVertWallLine(point: Point, wallAmount: number, isFirstSquare: boolean, isLastSquare: boolean){
        if (point.x === MazeCreator.GRID_COLUMNS[0] || point.x === MazeCreator.GRID_COLUMNS[MazeCreator.GRID_COLUMNS.length - 1])
            throw new Error('Vertical wall line was made on the obstacle!');

        const arr = new Array<WallElement>();

        let visibleMainPoint = new Point(point.x, point.y);
        if (visibleMainPoint.y !== this.GRID_LINES[0] && isFirstSquare) {
            arr.push(ObstacleCreator.createWall(visibleMainPoint, 0, MazeCreator._wallMaterialNum, 1, false));
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
        )

        for (let i = 0; i < wallAmount; i++) {
            if (visibleMainPoint.y >= MazeCreator.GRID_LINES[MazeCreator.GRID_LINES.length - 1])
                throw new Error('Vertical wall line was made on the obstacle!');

            arr.push(ObstacleCreator.createWall(
                    new Point(actualMainPoint.x, actualMainPoint.y),
                    Math.PI / 2, MazeCreator._wallMaterialNum, 0, false
                )
            );
            actualMainPoint = new Point(actualMainPoint.x, actualMainPoint.y + ResolutionManager.WALL_WIDTH[0]);
            visibleMainPoint = new Point(visibleMainPoint.x, visibleMainPoint.y + ResolutionManager.WALL_WIDTH[0]);

            if (i !== wallAmount - 1) {
                arr.push(ObstacleCreator.createWall(
                        new Point(visibleMainPoint.x, visibleMainPoint.y),
                        0, MazeCreator._wallMaterialNum, 1, false
                    )
                );
                visibleMainPoint = new Point(visibleMainPoint.x, visibleMainPoint.y + ResolutionManager.WALL_HEIGHT[1]);
                actualMainPoint = new Point(actualMainPoint.x, actualMainPoint.y + ResolutionManager.WALL_HEIGHT[1]);
            }
            else if (point.y + wallAmount * (ResolutionManager.WALL_WIDTH[0] + ResolutionManager.WALL_HEIGHT[1]) <
                MazeCreator.GRID_LINES[MazeCreator.GRID_LINES.length - 1] && isLastSquare) {
                    arr.push(ObstacleCreator.createWall(
                            new Point(visibleMainPoint.x, visibleMainPoint.y),
                            0, MazeCreator._wallMaterialNum, 1, false
                        )
                    );
                }
        }

        this._wallHandlingManagers.add(arr);
    }
}