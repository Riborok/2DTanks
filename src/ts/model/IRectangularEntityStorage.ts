import {RectangularEntity} from "./IEntity";
import {GeomInteractionUtils} from "./GeomInteractionUtils";

export interface IRectangularEntityStorage {
    insert(rectangularEntity: RectangularEntity): void;
    remove(rectangularEntity: RectangularEntity): void;
    isCollision(rectangularEntity: RectangularEntity): boolean;
}

export class Arr implements IRectangularEntityStorage {
    private entities: RectangularEntity[] = [];

    public insert(rectangularEntity: RectangularEntity): void {
        this.entities.push(rectangularEntity);
    }

    public remove(rectangularEntity: RectangularEntity): void {
        const index = this.entities.indexOf(rectangularEntity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    public isCollision(rectangularEntity: RectangularEntity): boolean {
        for (const entity of this.entities) {
            if (entity !== rectangularEntity &&
                    GeomInteractionUtils.isCross(rectangularEntity, entity)) {
                console.log(entity)
                return true;
            }
        }
        return false;
    }
}

export class Quadtree implements IRectangularEntityStorage{
    private readonly _root: QuadtreeNode;

    public constructor(x: number, y: number, width: number, height: number) {
        this._root = new QuadtreeNode({ x, y, width, height });
    }

    public insert(rectangularEntity: RectangularEntity) {
        this._root.insert(rectangularEntity);
    }

    public isCollision(rectangularEntity: RectangularEntity): boolean {
        return this._root.isCollision(rectangularEntity);
    }

    public remove(rectangularEntity: RectangularEntity) {
        this._root.remove(rectangularEntity);
    }
}

class QuadtreeNode {
    private static readonly CAPACITY: number = 8;
    private static readonly HALF_CAPACITY: number = QuadtreeNode.CAPACITY >> 1;

    private _rectangularEntities: Map<number, RectangularEntity> = new Map();
    private _children: QuadtreeNode[] = [];
    private readonly _boundary: { x: number, y: number, width: number, height: number };

    public constructor(boundary: { x: number, y: number, width: number, height: number }) {
        this._boundary = boundary;
    }
    private subdivide() {
        const x = this._boundary.x;
        const y = this._boundary.y;
        const width = this._boundary.width >> 1;
        const height = this._boundary.height >> 1;

        this._children.push(new QuadtreeNode({ x, y, width, height }));
        this._children.push(new QuadtreeNode({ x: x + width, y, width, height }));
        this._children.push(new QuadtreeNode({ x, y: y + height, width, height }));
        this._children.push(new QuadtreeNode({ x: x + width, y: y + height, width, height }));

        this.redistribute();
    }
    private redistribute() {
        const remainingRectangularEntities: Map<number, RectangularEntity> = new Map();

        for (const [id, rectangularEntity] of this._rectangularEntities) {
            let isRedistributed = false;
            for (const child of this._children) {
                if (child.isContains(rectangularEntity)) {
                    child.insert(rectangularEntity);
                    isRedistributed = true;
                    break;
                }
            }
            if (!isRedistributed)
                remainingRectangularEntities.set(id, rectangularEntity);
        }
        this._rectangularEntities = remainingRectangularEntities;
    }
    public insert(rectangularEntity: RectangularEntity): void {
        if (this._children.length > 0) {
            for (const child of this._children) {
                if (child.isContains(rectangularEntity)) {
                    child.insert(rectangularEntity);
                    return;
                }
            }
        }
        this._rectangularEntities.set(rectangularEntity.id, rectangularEntity);
        if (this._children.length === 0 && this._rectangularEntities.size > QuadtreeNode.CAPACITY)
            this.subdivide();
    }
    public remove(rectangularEntity: RectangularEntity) {
        if (this._children.length > 0) {
            for (const child of this._children) {
                if (child.isContains(rectangularEntity)) {
                    child.remove(rectangularEntity);

                    let totalChildCount = 0;
                    for (const child of this._children)
                        totalChildCount += child.getRectangularEntitiesCount();

                    if (totalChildCount <= QuadtreeNode.HALF_CAPACITY)
                        this.mergeWithChildren();

                    return;
                }
            }
        }

        this._rectangularEntities.delete(rectangularEntity.id);
    }
    public isCollision(rectangularEntity: RectangularEntity): boolean {
        if (!this.isContains(rectangularEntity))
            return false;

        for (const child of this._children) {
            if (child.isContains(rectangularEntity)) {
                return child.isCollision(rectangularEntity);
            }
        }

        for (const [id, otherRectangularEntity] of this._rectangularEntities)
            if (otherRectangularEntity !== rectangularEntity &&
                    GeomInteractionUtils.isCross(rectangularEntity, otherRectangularEntity))
                return true;

        return false;
    }
    private mergeWithChildren() {
        for (const child of this._children) {
            if (child._children.length !== 0)
                child.mergeWithChildren();
            for (const [key, value] of child._rectangularEntities)
                this._rectangularEntities.set(key, value);
        }

        this._children = [];
    }
    private getRectangularEntitiesCount(): number {
        let count = this._rectangularEntities.size;
        for (const child of this._children)
            count += child.getRectangularEntitiesCount();
        return count;
    }
    private isContains(rectangularEntity: RectangularEntity): boolean {
        for (const point of rectangularEntity.points)
            if (point.x < this._boundary.x || point.x > this._boundary.x + this._boundary.width ||
                point.y < this._boundary.y || point.y > this._boundary.y + this._boundary.height)
                return false;

        return true;
    }
}
