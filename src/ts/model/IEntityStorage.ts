import {IEntity} from "./IEntity";
import {GeomInteractionUtils} from "./GeomInteractionUtils";
import {Point} from "./Point";

export interface IEntityStorage {
    insert(entity: IEntity): void;
    remove(entity: IEntity): void;
    isCollision(entity: IEntity): boolean;
}

export class Arr implements IEntityStorage {
    private entities: IEntity[] = [];

    public insert(entity: IEntity): void {
        this.entities.push(entity);
    }

    public remove(entity: IEntity): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    public isCollision(entity: IEntity): boolean {
        for (const anotherEntity of this.entities) {
            if (anotherEntity !== entity &&
                    GeomInteractionUtils.isIntersect(entity, anotherEntity)) {
                return true;
            }
        }
        return false;
    }
}

export class Quadtree implements IEntityStorage{
    private readonly _root: QuadtreeNode;

    public constructor(xStart: number, yStart: number, xLast: number, yLast: number) {
        this._root = new QuadtreeNode({ xStart, yStart, xLast, yLast }, null);
    }

    public insert(entity: IEntity) {
        this._root.insert(entity);
    }

    public isCollision(entity: IEntity): boolean {
        return this._root.isCollision(entity);
    }

    public remove(entity: IEntity) {
        this._root.remove(entity);
    }
}

class QuadtreeNode {
    private static readonly CAPACITY: number = 8;
    private static readonly HALF_CAPACITY: number = QuadtreeNode.CAPACITY >> 1;

    private _entities: Set<IEntity> | null = new Set<IEntity>();
    private _children: QuadtreeNode[] | null = null;

    private readonly _parent: QuadtreeNode | null;
    private readonly _boundary: { xStart: number, yStart: number, xLast: number, yLast: number };
    public constructor(boundary: { xStart: number, yStart: number, xLast: number, yLast: number },
                       parent: QuadtreeNode | null) {
        this._boundary = boundary;
        this._parent = parent;
    }
    private isSubdivide(): boolean { return this._entities === null }
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
        for (const entity of this._entities)
            for (const child of this._children)
                if (child.isContainsEntity(entity))
                    child.insert(entity);

        this._entities = null;
    }
    public insert(entity: IEntity) {
        if (this.isSubdivide()) {
            for (const child of this._children)
                if (child.isContainsEntity(entity))
                    child.insert(entity);
        }
        else {
            this._entities.add(entity);
            if (this._entities.size > QuadtreeNode.CAPACITY)
                this.subdivide();
        }
    }
    public remove(entity: IEntity) {
        if (this.isSubdivide()) {
            for (const child of this._children)
                if (child.isContainsEntity(entity))
                    child.remove(entity);
            this.mergeCheck();
        }
        else {
            this._entities.delete(entity);
            if (this._parent !== null)
                this._parent.mergeCheck();
        }
    }
    public isCollision(entity: IEntity): boolean {
        if (this.isSubdivide()) {
            for (const child of this._children)
                if (child.isContainsEntity(entity) && child.isCollision(entity))
                    return true;
        }
        else {
            for (const anotherEntity of this._entities)
                if (entity !== anotherEntity &&
                        GeomInteractionUtils.isIntersect(entity, anotherEntity))
                    return true;
        }
        return false;
    }
    private isContainsEntity(entity: IEntity): boolean {
        for (const point of entity.points)
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
            totalChildCount += child.getEntitiesCount();

        if (totalChildCount <= QuadtreeNode.HALF_CAPACITY)
            this.mergeWithChildren();
    }
    private mergeWithChildren() {
        this._entities = new Set<IEntity>();
        for (const child of this._children) {
            if (child.isSubdivide())
                child.mergeWithChildren();
            for (const entity of child._entities)
                this._entities.add(entity);
        }

        this._children = null;
    }
    private getEntitiesCount(): number {
        if (this.isSubdivide()) {
            let count = 0;
            for (const child of this._children)
                count += child.getEntitiesCount();
            return count;
        }
        else
            return this._entities.size;
    }
}
