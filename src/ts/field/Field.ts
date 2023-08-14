import {CHUNK_SIZE} from "../constants";
import {IEntity} from "../model/IEntity";

export class Field {
    private readonly _entities: IEntity[][][];
    private readonly _canvas: any;
    private readonly _width: number;
    private readonly _height: number;
    public get canvas(): any { return this._canvas }
    public get width(): number { return this._width }
    public get height(): number { return this._height }
    constructor(canvas: any, width: number, height: number) {
        this._canvas = canvas;
        this._width = width;
        this._height = height;
        this._entities = [];
        for (let i = 0; i < Math.ceil(width / CHUNK_SIZE); i++) {
            this._entities[i] = [];
            for (let j = 0; j < Math.ceil(height / CHUNK_SIZE); j++) {
                this._entities[i][j] = [];
            }
        }
    }

    public addObject(entity: IEntity) {
        for (const point of entity.points) {
            const chunkX = Math.floor(point.x / CHUNK_SIZE);
            const chunkY = Math.floor(point.y / CHUNK_SIZE);
            if (this._entities[chunkX][chunkY][this._entities[chunkX][chunkY].length - 1] !== entity) {
                this._entities[chunkX][chunkY].push(entity);
            }
        }
    }
}