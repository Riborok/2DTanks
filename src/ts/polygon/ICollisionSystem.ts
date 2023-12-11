import {CollisionDetector} from "../geometry/CollisionDetector";
import {Axis, Point} from "../geometry/Point";
import {IStaticAxis, IStorage} from "../additionally/type";
import {IPolygon} from "./IPolygon";
import {calcMidBetweenTwoPoint} from "../geometry/additionalFunc";
import {ModelIDTracker} from "../game/id/ModelIDTracker";

export interface ICollisionDetection<T extends IPolygon> {
    getCollisions(polygon: IPolygon): Iterable<T>;
}

export interface ICollisionSystem<T extends IPolygon> extends IStorage<T>, ICollisionDetection<T> {

}

class Boundary implements IPolygon, IStaticAxis {
    private static readonly ANGLE: number = 0;

    private readonly _id: number;
    private readonly _points: Point[];
    private readonly _axes: Axis[];
    public constructor(xStart: number, yStart: number, xLast: number, yLast: number, id: number) {
        this._id = id;
        this._points = [
            new Point(xStart, yStart),
            new Point(xLast, yStart),
            new Point(xLast, yLast),
            new Point(xStart, yLast)
        ];
        this._axes = [
            Axis.create(this._points[0], this._points[1]),
            Axis.create(this._points[1], this._points[2]),
            Axis.create(this._points[2], this._points[3]),
            Axis.create(this._points[3], this._points[0])
        ];
    }
    public get angle(): number { return Boundary.ANGLE; }
    public calcCenter(): Point { return calcMidBetweenTwoPoint(this._points[0], this._points[2]); }
    public get id(): number { return this._id; }
    public get points(): Point[] { return this._points; }
    get axes(): Axis[] { return this._axes; }
}

export class Quadtree<T extends IPolygon> implements ICollisionSystem<T>{
    private _root: QuadtreeNode<T>;
    private readonly _boundary: Boundary;
    public constructor(xStart: number, yStart: number, xLast: number, yLast: number) {
        this._boundary = new Boundary(xStart, yStart, xLast, yLast, ModelIDTracker.quadtreeBoundaryId);
        this._root = new QuadtreeNode(this._boundary);
    }
    public insert(t: T) {
        this._root.insert(t, CollisionDetector.getAxes(t));
    }
    public getCollisions(polygon: IPolygon): Iterable<T> {
        const collisionsInfo = new Map<number, T>;
        this._root.getCollisions(polygon, CollisionDetector.getAxes(polygon), collisionsInfo);
        return [...collisionsInfo.values()];
    }
    public remove(t: T) {
        this._root.remove(t, CollisionDetector.getAxes(t));
    }
    public clear() {
        this._root = new QuadtreeNode(this._boundary);
    }
}

class QuadtreeNode<T extends IPolygon> {
    private static readonly CAPACITY: number = 8;

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
        const xStart = this._boundary.points[0].x;
        const yStart = this._boundary.points[0].y;
        const xLast = this._boundary.points[2].x;
        const yLast = this._boundary.points[2].y;

        const width = (xLast - xStart) / 2;
        const height = (yLast - yStart) / 2;

        this._children = [
            new QuadtreeNode<T>(new Boundary( xStart, yStart, xStart + width, yStart + height, ModelIDTracker.quadtreeBoundaryId )),
            new QuadtreeNode<T>(new Boundary( xStart + width, yStart, xLast, yStart + height, ModelIDTracker.quadtreeBoundaryId )),
            new QuadtreeNode<T>(new Boundary( xStart, yStart + height, xStart + width, yLast, ModelIDTracker.quadtreeBoundaryId )),
            new QuadtreeNode<T>(new Boundary( xStart + width, yStart + height, xLast, yLast, ModelIDTracker.quadtreeBoundaryId ))
        ];

        this.redistribute();
    }
    private redistribute() {
        this._totalPolygons = 0;

        for (const t of this._polygons.values()) {
            const axes = CollisionDetector.getAxes(t);
            for (const child of this._children)
                child.insert(t, axes);
        }

        for (const child of this._children)
            this._totalPolygons += child._totalPolygons;

        this._polygons = null;
    }
    public insert(t: T, axes: Axis[]) {
        if (CollisionDetector.hasCollision(this._boundary, t, this._boundary.axes, axes)) {
            if (this.isSubdivide()) {
                this._totalPolygons = 0;
                for (const child of this._children) {
                    child.insert(t, axes);
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
    public remove(t: T, axes: Axis[]) {
        if (CollisionDetector.hasCollision(this._boundary, t, this._boundary.axes, axes)) {
            if (this.isSubdivide()) {
                this._totalPolygons = 0;
                for (const child of this._children) {
                    child.remove(t, axes);
                    this._totalPolygons += child._totalPolygons;
                }
                if (this._totalPolygons <= (QuadtreeNode.CAPACITY >> 1))
                    this.mergeWithChildren();
            }
            else {
                this._totalPolygons--;
                this._polygons.delete(t.id);
            }
        }
    }
    public getCollisions(polygon: IPolygon, axes: Axis[], collisionsInfo: Map<number, T>) {
        if (this.isSubdivide()) {
            for (const child of this._children)
                if (CollisionDetector.hasCollision(child._boundary, polygon, child._boundary.axes, axes))
                    child.getCollisions(polygon, axes, collisionsInfo);
        }
        else {
            for (const anotherT of this._polygons.values())
                if (CollisionDetector.hasCollision(polygon, anotherT, axes, CollisionDetector.getAxes(anotherT)))
                    collisionsInfo.set(anotherT.id, anotherT);
        }
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