import {IEntity} from "./IEntity";
import {CollisionDetector} from "../geometry/CollisionDetector";
import {Point} from "../geometry/Point";

export interface IStorage<T> {
    insert(t: T): void;
    remove(t: T): void;
    clear(): void;
}

export interface ICollisionDetection {
    getCollisions(entity: IEntity): Iterable<IEntity>;
}

export interface IEntityCollisionSystem extends IStorage<IEntity>, ICollisionDetection {

}

type Boundary = { xStart: number, yStart: number, xLast: number, yLast: number }
export class Quadtree implements IEntityCollisionSystem{
    private _root: QuadtreeNode;
    private readonly _boundary: Boundary;
    public constructor(xStart: number, yStart: number, xLast: number, yLast: number) {
        this._boundary = { xStart, yStart, xLast, yLast };
        this._root = new QuadtreeNode(this._boundary, null);
    }
    public insert(entity: IEntity) {
        this._root.insert(entity);
    }
    public getCollisions(entity: IEntity): Iterable<IEntity> {
        return this._root.getCollisions(entity);
    }
    public remove(entity: IEntity) {
        this._root.remove(entity);
    }
    public clear() {
        this._root = new QuadtreeNode(this._boundary, null);
    }
}

class QuadtreeNode {
    private static readonly CAPACITY: number = 8;
    private static readonly HALF_CAPACITY: number = QuadtreeNode.CAPACITY >> 1;

    // The private variable _totalEntities represents the total amount of entities within a node.
    // However, it's important to note that this count may not be equivalent to the amount of entities in the node
    // if it's divided. Due to the possibility of entities being stored in multiple quadrants,
    // this count may be higher than the actual number of distinct entities.
    private _totalEntities: number = 0;
    private _entities: Map<number, IEntity> | null = new Map();
    private _children: QuadtreeNode[] | null = null;

    private readonly _parent: QuadtreeNode | null;
    private readonly _boundary: Boundary;
    public constructor(boundary: Boundary, parent: QuadtreeNode | null) {
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
        for (const entity of this._entities.values())
            for (const child of this._children)
                if (child.isContainsEntity(entity))
                    child.insert(entity);

        this._entities = null;
    }
    public insert(entity: IEntity) {
        this._totalEntities++;
        if (this.isSubdivide()) {
            for (const child of this._children)
                if (child.isContainsEntity(entity))
                    child.insert(entity);
        }
        else {
            this._entities.set(entity.id, entity);
            if (this._entities.size > QuadtreeNode.CAPACITY)
                this.subdivide();
        }
    }
    public remove(entity: IEntity) {
        this._totalEntities--;
        if (this.isSubdivide()) {
            for (const child of this._children)
                if (child.isContainsEntity(entity))
                    child.remove(entity);
            this.mergeCheck();
        }
        else {
            this._entities.delete(entity.id);
            if (this._parent !== null)
                this._parent.mergeCheck();
        }
    }
    public getCollisions(entity: IEntity): IEntity[] {
        const collisionsInfo = new Array<IEntity>();

        if (this.isSubdivide()) {
            for (const child of this._children)
                if (child.isContainsEntity(entity))
                    collisionsInfo.push(...child.getCollisions(entity));
        }
        else {
            for (const anotherEntity of this._entities.values())
                if (CollisionDetector.hasCollision(entity, anotherEntity))
                    collisionsInfo.push(anotherEntity);
        }

        return collisionsInfo;
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
        if (this._totalEntities <= QuadtreeNode.HALF_CAPACITY)
            this.mergeWithChildren();
    }
    private mergeWithChildren() {
        this._entities = new Map<number, IEntity>();
        for (const child of this._children) {
            if (child.isSubdivide())
                child.mergeWithChildren();
            for (const entity of child._entities.values())
                this._entities.set(entity.id, entity);
        }

        this._children = null;
    }
}
