import {RectangularEntity} from "./IEntity";
import {GeomInteractionUtils} from "./GeomInteractionUtils";
import {Point} from "./Point";

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
        for (const anotherRectangularEntity of this.entities) {
            if (anotherRectangularEntity !== rectangularEntity &&
                    GeomInteractionUtils.isCross(rectangularEntity, anotherRectangularEntity)) {
                return true;
            }
        }
        return false;
    }
}

export class Quadtree implements IRectangularEntityStorage{
    private readonly _root: QuadtreeNode;

    public constructor(xStart: number, yStart: number, xLast: number, yLast: number) {
        this._root = new QuadtreeNode({ xStart, yStart, xLast, yLast }, null);
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

    private _rectangularEntities: Set<RectangularEntity> | null = new Set<RectangularEntity>();
    private _children: QuadtreeNode[] | null = null;

    private readonly _parent: QuadtreeNode | null;
    private readonly _boundary: { xStart: number, yStart: number, xLast: number, yLast: number };
    public constructor(boundary: { xStart: number, yStart: number, xLast: number, yLast: number },
                       parent: QuadtreeNode | null) {
        this._boundary = boundary;
        this._parent = parent;
    }
    private isSubdivide(): boolean { return this._rectangularEntities === null }
    private subdivide() {
        const xStart = this._boundary.xStart;
        const yStart = this._boundary.yStart;
        const xLast = this._boundary.xLast;
        const yLast = this._boundary.yLast;

        const width = (xLast - xStart) / 2;
        const height = (yLast - yStart) / 2;

        this._children = [
            new QuadtreeNode({ xStart, yStart, xLast: xStart + width, yLast: yStart + height }, this),
            new QuadtreeNode({ xStart: xStart + width, yStart, xLast, yLast: yStart + height }, this),
            new QuadtreeNode({ xStart, yStart: yStart + height, xLast: xStart + width, yLast }, this),
            new QuadtreeNode({ xStart: xStart + width, yStart: yStart + height, xLast, yLast }, this)
        ];

        this.redistribute();
    }
    private redistribute() {
        for (const rectangularEntity of this._rectangularEntities)
            for (const child of this._children)
                if (child.isContainsRect(rectangularEntity))
                    child.insert(rectangularEntity);

        this._rectangularEntities = null;
    }
    public insert(rectangularEntity: RectangularEntity) {
        if (this.isSubdivide()) {
            for (const child of this._children)
                if (child.isContainsRect(rectangularEntity))
                    child.insert(rectangularEntity);
        }
        else {
            this._rectangularEntities.add(rectangularEntity);
            if (this._rectangularEntities.size > QuadtreeNode.CAPACITY)
                this.subdivide();
        }
    }
    public remove(rectangularEntity: RectangularEntity) {
        if (this.isSubdivide()) {
            for (const child of this._children)
                if (child.isContainsRect(rectangularEntity))
                    child.remove(rectangularEntity);
            this.mergeCheck();
        }
        else {
            this._rectangularEntities.delete(rectangularEntity);
            if (this._parent !== null)
                this._parent.mergeCheck();
        }
    }
    public isCollision(rectangularEntity: RectangularEntity): boolean {
        if (this.isSubdivide()) {
            for (const child of this._children)
                if (child.isContainsRect(rectangularEntity) && child.isCollision(rectangularEntity))
                    return true;
        }
        else {
            for (const anotherRectangularEntity of this._rectangularEntities)
                if (rectangularEntity !== anotherRectangularEntity &&
                        GeomInteractionUtils.isCross(rectangularEntity, anotherRectangularEntity))
                    return true;
        }
        return false;
    }
    private isContainsRect(rectangularEntity: RectangularEntity): boolean {
        for (const point of rectangularEntity.points)
            if (this.isContainsPoint(point))
                return true;

        return false;
    }
    private isContainsPoint(point: Point): boolean {
        return point.x > this._boundary.xStart && point.x < this._boundary.xLast &&
            point.y > this._boundary.yStart && point.y < this._boundary.yLast;
    }
    private mergeCheck() {
        let totalChildCount = 0;
        for (const child of this._children)
            totalChildCount += child.getRectangularEntitiesCount();

        if (totalChildCount <= QuadtreeNode.HALF_CAPACITY)
            this.mergeWithChildren();
    }
    private mergeWithChildren() {
        this._rectangularEntities = new Set<RectangularEntity>();
        for (const child of this._children) {
            if (child.isSubdivide())
                child.mergeWithChildren();
            for (const rectangularEntity of child._rectangularEntities)
                this._rectangularEntities.add(rectangularEntity);
        }

        this._children = null;
    }
    private getRectangularEntitiesCount(): number {
        if (this.isSubdivide()) {
            let count = 0;
            for (const child of this._children)
                count += child.getRectangularEntitiesCount();
            return count;
        }
        else
            return this._rectangularEntities.size;
    }
}
