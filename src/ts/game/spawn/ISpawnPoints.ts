import {Point} from "../../geometry/Point";
import {ResolutionManager, WALL_GRID_COLUMNS_AMOUNT, WALL_GRID_LINES_AMOUNT} from "../../constants/gameConstants";
import {getRandomInt} from "../../additionally/additionalFunc";

export interface ISpawnPoints {
    getRandomSpawnPoint(width: number, height: number): Point;
    getSpawnPoint(width: number, height: number, row: number, column: number): Point;
}

export class SpawnPoints implements ISpawnPoints{
    private _spawnGridLinesAmount: number = WALL_GRID_LINES_AMOUNT - 1;
    private _spawnGridColumnsAmount: number = WALL_GRID_COLUMNS_AMOUNT - 1;
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

        for (let i = 0; i < this._spawnGridLinesAmount; i++){
            this._spawnPoints[i] = [];

            for (let j = 0; j < this._spawnGridColumnsAmount; j++){
                this._spawnPoints[i][j] = new Point(
                    firstSpawnPoint.x + indentX * j,
                    firstSpawnPoint.y + indentY * i
                );
            }
        }
    }

    public getRandomSpawnPoint(width: number, height: number): Point {
        const line = getRandomInt(0, this._spawnGridLinesAmount - 1);
        const column = getRandomInt(0, this._spawnGridColumnsAmount - 1);

        const point = this._spawnPoints[line][column];

        return new Point(point.x - width / 2, point.y - height / 2);
    }

    public getSpawnPoint(width: number, height: number, line: number, column: number): Point {
        const point = this._spawnPoints[line][column];

        return new Point(point.x - width / 2, point.y - height / 2);
    }

}