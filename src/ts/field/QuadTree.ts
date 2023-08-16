import { RectangularEntity } from "../model/IEntity";

class QuadtreeNode {
    private static readonly CAPACITY: number = 4;
    private _rectangularEntities: Set<RectangularEntity> = new Set();
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
        const remainingRectangularEntity: Set<RectangularEntity> = new Set();

        for (const object of this._rectangularEntities) {
            let isRedistributed = false;
            for (const child of this._children) {
                if (child.isContains(object)) {
                    child.insert(object);
                    isRedistributed = true;
                    break;
                }
            }
            if (!isRedistributed)
                remainingRectangularEntity.add(object);
        }
        this._rectangularEntities = remainingRectangularEntity;
    }

    public insert(rectangularEntity: RectangularEntity): void {
        if (this._children.length > 0) {
            for (const child of this._children) {
                if (child.isContains(rectangularEntity)) {
                    child.insert(rectangularEntity);
                    return;
                }
            }
            this._rectangularEntities.add(rectangularEntity);
        }
        else if (this.isContains(rectangularEntity)) {
            if (this._rectangularEntities.size < QuadtreeNode.CAPACITY)
                this._rectangularEntities.add(rectangularEntity);
            else {
                this.subdivide();

                for (const child of this._children) {
                    if (child.isContains(rectangularEntity)) {
                        child.insert(rectangularEntity);
                        return;
                    }
                }
                this._rectangularEntities.add(rectangularEntity);
            }
        }
    }

    public remove(rectangularEntity: RectangularEntity) {
        if (this._children.length > 0) {
            for (const child of this._children) {
                if (child.isContains(rectangularEntity)) {
                    child.remove(rectangularEntity);
                    return;
                }
            }
        }

        this._rectangularEntities.delete(rectangularEntity);
    }

    public checkIntersection(rectangularEntity: RectangularEntity): RectangularEntity | null {
        if (!this.isContains(rectangularEntity))
            return null;

        for (const child of this._children) {
            if (child.isContains(rectangularEntity)) {
                return child.checkIntersection(rectangularEntity);
            }
        }

        for (const otherRectangularEntity of this._rectangularEntities)
            if (otherRectangularEntity !== rectangularEntity && this.isCross(rectangularEntity, otherRectangularEntity))
                return otherRectangularEntity;

        return null;
    }

    private isCross(rectangle1: RectangularEntity, rectangle2: RectangularEntity): boolean {
        return rectangle1.points[0].x <= rectangle2.points[1].x &&
            rectangle1.points[1].x >= rectangle2.points[0].x &&
            rectangle1.points[0].y >= rectangle2.points[2].y &&
            rectangle1.points[2].y <= rectangle2.points[0].y;
    }

    private isContains(rectangularEntity: RectangularEntity): boolean {
        return rectangularEntity.points[0].x >= this._boundary.x &&
            rectangularEntity.points[0].x <= this._boundary.x + this._boundary.width &&
            rectangularEntity.points[0].y >= this._boundary.y &&
            rectangularEntity.points[0].y <= this._boundary.y + this._boundary.height;
    }
}

export class Quadtree {
    private _root: QuadtreeNode;

    public constructor(x: number, y: number, width: number, height: number) {
        this._root = new QuadtreeNode({ x, y, width, height });
    }

    public insert(rectangularEntity: RectangularEntity): void {
        this._root.insert(rectangularEntity);
    }

    public checkIntersection(rectangularEntity: RectangularEntity): RectangularEntity | null {
        return this._root.checkIntersection(rectangularEntity);
    }

    public remove(rectangularEntity: RectangularEntity) {
        this._root.remove(rectangularEntity);
    }
}
