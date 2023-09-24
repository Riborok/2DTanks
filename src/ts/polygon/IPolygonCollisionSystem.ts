import {CollisionDetector} from "../geometry/CollisionDetector";
import {Point} from "../geometry/Point";
import {IStorage} from "../additionally/type";
import {IPolygon} from "./IPolygon";

export interface ICollisionDetection<T extends IPolygon> {
    getCollisions(polygon: IPolygon): Iterable<T>;
}

export interface IPolygonCollisionSystem<T extends IPolygon> extends IStorage<T>, ICollisionDetection<T> {

}

type Boundary = { xStart: number, yStart: number, xLast: number, yLast: number }
export class Quadtree<T extends IPolygon> implements IPolygonCollisionSystem<T>{
    private _root: QuadtreeNode<T>;
    private readonly _boundary: Boundary;
    public constructor(xStart: number, yStart: number, xLast: number, yLast: number) {
        this._boundary = { xStart, yStart, xLast, yLast }
        this._root = new QuadtreeNode(this._boundary);
    }
    public insert(t: T) {
        this._root.insert(t);
    }
    public getCollisions(polygon: IPolygon): Iterable<T> {
        return this._root.getCollisions(polygon);
    }
    public remove(t: T) {
        this._root.remove(t);
    }
    public clear() {
        this._root = new QuadtreeNode(this._boundary);
    }
}

class QuadtreeNode<T extends IPolygon> {
    private static readonly CAPACITY: number = 8;
    private static readonly HALF_CAPACITY: number = QuadtreeNode.CAPACITY >> 1;

    // The private variable _totalPolygons represents the total amount of polygons within a node.
    // However,this count may not be equivalent to the amount of polygons in the node
    // if it's divided. Due to the possibility of polygons being stored in multiple quadrants,
    // this count may be higher than the actual amount of polygons.
    private _totalPolygons: number = 0;
    private _polygons: Map<number, T> | null = new Map();
    private _children: QuadtreeNode<T>[] | null = null;

    private readonly _boundary: Boundary;
    public constructor(boundary: Boundary) { this._boundary = boundary }
    private isSubdivide(): boolean { return this._polygons === null }
    private subdivide() {
        const xStart = this._boundary.xStart;
        const yStart = this._boundary.yStart;
        const xLast = this._boundary.xLast;
        const yLast = this._boundary.yLast;

        const width = (xLast - xStart) / 2;
        const height = (yLast - yStart) / 2;

        this._children = [
            new QuadtreeNode<T>({ xStart, yStart, xLast: xStart + width, yLast: yStart + height }),
            new QuadtreeNode<T>({ xStart: xStart + width, yStart, xLast, yLast: yStart + height }),
            new QuadtreeNode<T>({ xStart, yStart: yStart + height, xLast: xStart + width, yLast }),
            new QuadtreeNode<T>({ xStart: xStart + width, yStart: yStart + height, xLast, yLast })
        ];

        this.redistribute();
    }
    private redistribute() {
        this._totalPolygons = 0;
        for (const child of this._children) {
            for (const t of this._polygons.values())
                child.insert(t);
            this._totalPolygons += child._totalPolygons;
        }

        this._polygons = null;
    }
    public insert(t: T) {
        if (this.isContainsPolygon(t)) {
            if (this.isSubdivide()) {
                this._totalPolygons = 0;
                for (const child of this._children) {
                    child.insert(t);
                    this._totalPolygons += child._totalPolygons;
                }
            }
            else {
                this._totalPolygons++;
                this._polygons.set(t.id, t);
                if (this._polygons.size > QuadtreeNode.CAPACITY)
                    this.subdivide();
            }
        }
    }
    public remove(t: T) {
        if (this.isContainsPolygon(t)) {
            if (this.isSubdivide()) {
                this._totalPolygons = 0;
                for (const child of this._children) {
                    child.remove(t);
                    this._totalPolygons += child._totalPolygons;
                }
                if (this._totalPolygons <= QuadtreeNode.HALF_CAPACITY)
                    this.mergeWithChildren();
            }
            else {
                this._totalPolygons--;
                this._polygons.delete(t.id);
            }
        }
    }
    public getCollisions(polygon: IPolygon): T[] {
        const collisionsInfo = new Array<T>();

        if (this.isSubdivide()) {
            for (const child of this._children)
                if (child.isContainsPolygon(polygon))
                    collisionsInfo.push(...child.getCollisions(polygon));
        }
        else {
            for (const anotherT of this._polygons.values())
                if (CollisionDetector.hasCollision(polygon, anotherT))
                    collisionsInfo.push(anotherT);
        }

        return collisionsInfo;
    }
    private isContainsPolygon(polygon: IPolygon): boolean {
        for (const point of polygon.points)
            if (this.isContainsPoint(point))
                return true;

        return false;
    }
    private isContainsPoint(point: Point): boolean {
        return point.x > this._boundary.xStart && point.x < this._boundary.xLast &&
            point.y > this._boundary.yStart && point.y < this._boundary.yLast;
    }
    private mergeWithChildren() {
        this._polygons = new Map<number, T>();
        for (const child of this._children) {
            if (child.isSubdivide())
                child.mergeWithChildren();
            for (const t of child._polygons.values())
                this._polygons.set(t.id, t);
        }
        this._totalPolygons = this._polygons.size;

        this._children = null;
    }
}