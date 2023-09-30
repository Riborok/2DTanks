import {Point} from "../../geometry/Point";
import {ResolutionManager, SPAWN_GRIDS_COLUMNS_AMOUNT, SPAWN_GRIDS_LINES_AMOUNT} from "../../constants/gameConstants";
import {getRandomInt} from "../../additionally/additionalFunc";

export interface ISpawnPoints {
    getRandomSpawnPoint(width: number, height: number,
                        minLine?: number, maxLine?: number, minColumn?: number, maxColumn?: number): Point;
    getSpawnPoint(width: number, height: number, line: number, column: number): Point;
}

export class SpawnPoints implements ISpawnPoints{
    private _spawnPoints: Point[][] = [];

    constructor(point: Point) {
        this.calcSpawnPoints(point);
    }

    private calcSpawnPoints(point: Point): void {
        const firstSpawnPoint = new Point(
            point.x + ResolutionManager.WALL_WIDTH[0],
            point.y + ResolutionManager.WALL_HEIGHT[0] + ResolutionManager.WALL_WIDTH[0] / 2
        );
        const indentX = ResolutionManager.WALL_WIDTH[0] + ResolutionManager.WALL_WIDTH[1];
        const indentY = ResolutionManager.WALL_WIDTH[0] + ResolutionManager.WALL_HEIGHT[1];

        for (let i = 0; i < SPAWN_GRIDS_LINES_AMOUNT; i++){
            this._spawnPoints[i] = [];

            for (let j = 0; j < SPAWN_GRIDS_COLUMNS_AMOUNT; j++){
                this._spawnPoints[i][j] = new Point(
                    firstSpawnPoint.x + indentX * j,
                    firstSpawnPoint.y + indentY * i
                );
            }
        }
    }

    public getRandomSpawnPoint(width: number, height: number,
                               minLine: number = 0, maxLine: number = SPAWN_GRIDS_LINES_AMOUNT - 1,
                               minColumn: number = 0, maxColumn: number = SPAWN_GRIDS_COLUMNS_AMOUNT - 1): Point {
        const line = getRandomInt(minLine, maxLine);
        const column = getRandomInt(minColumn, maxColumn);

        const point = this._spawnPoints[line][column];

        return new Point(point.x - width / 2, point.y - height / 2);
    }

    public getSpawnPoint(width: number, height: number, line: number, column: number): Point {
        const point = this._spawnPoints[line][column];

        return new Point(point.x - width / 2, point.y - height / 2);
    }

}