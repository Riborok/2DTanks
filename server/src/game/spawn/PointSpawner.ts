import {Point} from "../../geometry/Point";
import {ResolutionManager} from "../../constants/gameConstants";
import {getRandomInt} from "../../utils/additionalFunc";

export interface IPointSpawner {
    getRandomSpawnPoint(width: number, height: number,
                        minLine?: number, maxLine?: number, minColumn?: number, maxColumn?: number): Point;
    getSpawnPoint(width: number, height: number, line: number, column: number): Point;
}

export class PointSpawner implements IPointSpawner{
    private _spawnPoints: Point[][] = [];
    private readonly _spawnGridsLinesAmount: number;
    private readonly _spawnGridsColumnsAmount: number;

    public constructor(point: Point, spawnGridsLinesAmount: number, spawnGridsColumnsAmount: number) {
        this._spawnGridsLinesAmount = spawnGridsLinesAmount;
        this._spawnGridsColumnsAmount = spawnGridsColumnsAmount;
        this.calcSpawnPoints(point);
    }

    private calcSpawnPoints(point: Point): void {
        const firstSpawnPoint = new Point(
            point.x + ResolutionManager.WALL_WIDTH[0],
            point.y + ResolutionManager.WALL_HEIGHT[0] + ResolutionManager.WALL_WIDTH[0] / 2
        );
        const indentX = ResolutionManager.WALL_WIDTH[0] + ResolutionManager.WALL_WIDTH[1];
        const indentY = ResolutionManager.WALL_WIDTH[0] + ResolutionManager.WALL_HEIGHT[1];

        for (let i = 0; i < this._spawnGridsLinesAmount; i++){
            this._spawnPoints[i] = [];

            for (let j = 0; j < this._spawnGridsColumnsAmount; j++){
                this._spawnPoints[i][j] = new Point(
                    firstSpawnPoint.x + indentX * j,
                    firstSpawnPoint.y + indentY * i
                );
            }
        }
    }

    public getRandomSpawnPoint(width: number, height: number,
                               minLine: number = 0, maxLine: number = this._spawnGridsLinesAmount - 1,
                               minColumn: number = 0, maxColumn: number = this._spawnGridsColumnsAmount - 1): Point {
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


