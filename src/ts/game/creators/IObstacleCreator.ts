import {WALL_HEIGHT, WALL_MASS, WALL_WIDTH} from "../../constants/gameConstants";
import {RectangularEntity} from "../../model/entitiy/IEntity";
import {IDTracker} from "../id/IDTracker";
import {WallElement} from "../elements/WallElement";
import {WallSprite} from "../../sprite/obstacles/WallSprite";
import {WallModel} from "../../model/obstacle/WallModel";
import {Point} from "../../geometry/Point";
import {ILinkedList, LinkedList} from "../../additionally/ILinkedList";

export class ObstacleCreator {
    private static readonly INDENT: number = 10;
    private static readonly RAD_90: number = 90 * Math.PI / 180;
    private static readonly RECT_NUM: number = 0;
    private constructor() { }
    public static createWallsAroundPerimeter(materialNum: number, width: number, height: number): Iterable<WallElement> {
        const result = new LinkedList<WallElement>;
        const xIndent = this.calcIndent(width);
        const yIndent = this.calcIndent(height - (WALL_HEIGHT[this.RECT_NUM] << 1));
        this.createHorWalls(materialNum, xIndent, yIndent, width, height, result)
        this.createVertWalls(materialNum, xIndent, yIndent, width, height, result);
        return result;
    }
    private static calcIndent(totalLength: number): number {
        const currLength = totalLength - (this.INDENT << 1);
        const indent = currLength - WALL_WIDTH[this.RECT_NUM] * Math.floor(currLength / WALL_WIDTH[this.RECT_NUM]);
        return (indent >> 1) + this.INDENT;
    }
    private static createHorWalls(materialNum: number, xIndent: number, yIndent: number,
                                      width: number, height: number, list: ILinkedList<WallElement>) {
        for (let x = xIndent; x <= width - xIndent - WALL_WIDTH[this.RECT_NUM]; x += WALL_WIDTH[this.RECT_NUM]) {
            list.addToHead(this.createWall(new Point(x, yIndent), 0, materialNum, this.RECT_NUM));
            list.addToHead(this.createWall(new Point(x, height - WALL_HEIGHT[this.RECT_NUM] - yIndent),
                0, materialNum, this.RECT_NUM));
        }
    }
    private static createVertWalls(materialNum: number, xIndent: number, yIndent: number,
                                       width: number, height: number, list: ILinkedList<WallElement>) {
        for (let y = yIndent + WALL_HEIGHT[this.RECT_NUM] + (WALL_HEIGHT[this.RECT_NUM] >> 1);
                y <= height - yIndent - WALL_WIDTH[this.RECT_NUM]; y += WALL_WIDTH[this.RECT_NUM]) {
            list.addToHead(this.createWall(new Point(xIndent - (WALL_HEIGHT[this.RECT_NUM] >> 1), y),
                this.RAD_90, materialNum, this.RECT_NUM));
            list.addToHead(this.createWall(new Point(width - xIndent - WALL_WIDTH[this.RECT_NUM] +
                (WALL_HEIGHT[this.RECT_NUM] >> 1), y), this.RAD_90, materialNum, this.RECT_NUM));
        }
    }
    public static createWall(point: Point, angle: number, materialNum: number,
                             shapeNum: number, hasMass: boolean = false) : WallElement {
        const mass = hasMass ? WALL_MASS[materialNum][shapeNum] : Infinity;
        const model = new WallModel(new RectangularEntity(point,
            WALL_WIDTH[shapeNum], WALL_HEIGHT[shapeNum], angle, mass, IDTracker.wallId));

        const sprite = new WallSprite(materialNum, shapeNum);
        sprite.setPosition(point);
        sprite.setAngle(angle);

        return new WallElement(model, sprite);
    }
}