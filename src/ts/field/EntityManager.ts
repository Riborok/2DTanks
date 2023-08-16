import {CHUNK_SIZE} from "../constants";
import {RectangularEntity} from "../model/IEntity";
import {Point} from "../model/Point";

export class EntityManager {
    private readonly _rectangularEntities: RectangularEntity[][][];
    public constructor(width: number, height: number) {
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
        for (const point of rectangularEntity.points) {
            const { chunkX, chunkY } = EntityManager.chunkCalc(point);
            if (this._rectangularEntities[chunkX][chunkY][this._rectangularEntities[chunkX][chunkY].length - 1] !==
                    rectangularEntity) {
                this._rectangularEntities[chunkX][chunkY].push(rectangularEntity);
            }
        }
    }
    public checkForCollision(rectangularEntity: RectangularEntity){
        for (const point of rectangularEntity.points) {
            const { chunkX, chunkY } = EntityManager.chunkCalc(point);
            for (const otherRectangularEntity of this._rectangularEntities[chunkX][chunkY]) {
                if (otherRectangularEntity !== rectangularEntity &&
                        EntityManager.isCross(rectangularEntity, otherRectangularEntity)) {
                    const { dx, dy } = EntityManager.calculateCollisionVector(
                            rectangularEntity, otherRectangularEntity);
                    rectangularEntity.movePoints(dx, dy);
                }
            }
        }
    }
}