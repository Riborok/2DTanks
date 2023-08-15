import {CHUNK_SIZE} from "../constants";
import {RectangularEntity} from "../model/IEntity";
import {Point} from "../model/Point";

export class Field {
    private readonly _rectangularEntities: RectangularEntity[][][];
    private readonly _canvas: Element;
    private readonly _width: number;
    private readonly _height: number;
    public get canvas(): Element { return this._canvas }
    public get width(): number { return this._width }
    public get height(): number { return this._height }
    constructor(canvas: Element, width: number, height: number) {
        this._canvas = canvas;
        this._width = width;
        this._height = height;
        this._rectangularEntities = [];
        for (let i = 0; i < Math.ceil(width / CHUNK_SIZE); i++) {
            this._rectangularEntities[i] = [];
            for (let j = 0; j < Math.ceil(height / CHUNK_SIZE); j++) {
                this._rectangularEntities[i][j] = [];
            }
        }
    }
    private static chunkCalc(point: Point): {chunkX: number, chunkY: number}{
        return {
            chunkX: Math.floor(point.x / CHUNK_SIZE),
            chunkY: Math.floor(point.y / CHUNK_SIZE)
        }
    }
    private static isCross(rectangle1: RectangularEntity, rectangle2: RectangularEntity): boolean {
        const xOverlap = rectangle1.points[0].x < rectangle2.points[1].x &&
            rectangle1.points[1].x > rectangle2.points[0].x;
        const yOverlap = rectangle1.points[0].y > rectangle2.points[2].y &&
            rectangle1.points[2].y < rectangle2.points[0].y;
        return xOverlap && yOverlap;
    }
    private static calculateCollisionVector(rectangle1: RectangularEntity, rectangle2: RectangularEntity):
            {dx: number, dy: number} {
        const dx1 = rectangle2.points[1].x - rectangle1.points[0].x;
        const dx2 = rectangle1.points[1].x - rectangle2.points[0].x;
        const dx = Math.min(dx1, dx2);

        const dy1 = rectangle2.points[0].y - rectangle1.points[0].y;
        const dy2 = rectangle1.points[2].y - rectangle2.points[0].y;
        const dy = Math.min(dy1, dy2);

        return {dx, dy};
    }
    public addObject(rectangularEntity: RectangularEntity) {
        rectangularEntity.points.forEach((point: Point) => {
            const {chunkX, chunkY} = Field.chunkCalc(point);
            if (this._rectangularEntities[chunkX][chunkY][this._rectangularEntities[chunkX][chunkY].length - 1] !==
                    rectangularEntity) {
                this._rectangularEntities[chunkX][chunkY].push(rectangularEntity);
            }
        });
    }
    public checkForCollision(rectangularEntity: RectangularEntity){
        rectangularEntity.points.forEach((point: Point) => {
            const {chunkX, chunkY} = Field.chunkCalc(point);
            this._rectangularEntities[chunkX][chunkY].forEach((otherRectangularEntity: RectangularEntity) => {
                if (Field.isCross(rectangularEntity, otherRectangularEntity)){
                    const {dx, dy} = Field.calculateCollisionVector(rectangularEntity,
                        otherRectangularEntity);
                    rectangularEntity.movePoints(dx, dy);
                }
            })
        })
    }
}