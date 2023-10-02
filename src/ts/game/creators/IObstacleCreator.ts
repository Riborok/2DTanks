import {ResolutionManager, WALL_MASS} from "../../constants/gameConstants";
import {RectangularEntity} from "../../polygon/entity/IEntity";
import {ModelIDTracker} from "../id/ModelIDTracker";
import {WallElement} from "../elements/WallElement";
import {WallSprite} from "../../sprite/obstacles/WallSprite";
import {WallModel} from "../../model/obstacle/IWallModel";
import {Point} from "../../geometry/Point";
import {Size} from "../../additionally/type";

export class ObstacleCreator {
    private static readonly RAD_90: number = Math.PI / 2;
    private static readonly RECT_NUM: number = 0;
    private constructor() { }
    public static createWallsAroundPerimeter(widthWallAmount: number, heightWallAmount: number,
                                             materialNum: number, size: Size):
                                            {wallsArray: Iterable<WallElement>, point: Point} {
        const result = new Array<WallElement>();
        const xIndent = this.calcIndent(widthWallAmount, size.width);
        const yIndent = this.calcIndent(heightWallAmount,
            size.height - 2 * ResolutionManager.WALL_HEIGHT[0]);
        this.createHorWalls(materialNum, xIndent, yIndent, size, result)
        this.createVertWalls(materialNum, xIndent, yIndent, size, result);
        return { wallsArray: result, point: new Point(xIndent, yIndent) }
    }
    private static calcIndent(wallAmount: number, totalLength: number): number {
        return (totalLength - wallAmount * ResolutionManager.WALL_WIDTH[0]) / 2;
    }
    private static createHorWalls(materialNum: number, xIndent: number, yIndent: number, size: Size, arr: Array<WallElement>) {
        for (let x = xIndent; x <= size.width - xIndent - ResolutionManager.WALL_WIDTH[this.RECT_NUM]; x +=
            ResolutionManager.WALL_WIDTH[this.RECT_NUM]) {
            arr.push(this.createWall(new Point(x, yIndent), 0, materialNum, this.RECT_NUM));
            arr.push(this.createWall(new Point(x, size.height - ResolutionManager.WALL_HEIGHT[this.RECT_NUM] - yIndent),
                0, materialNum, this.RECT_NUM));
        }
    }
    private static createVertWalls(materialNum: number, xIndent: number, yIndent: number, size: Size, arr: Array<WallElement>) {
        for (let y = yIndent + ResolutionManager.WALL_HEIGHT[this.RECT_NUM] + (ResolutionManager.WALL_HEIGHT[this.RECT_NUM] >> 1);
             y <= size.height - yIndent - ResolutionManager.WALL_WIDTH[this.RECT_NUM]; y += ResolutionManager.WALL_WIDTH[this.RECT_NUM]) {
            arr.push(this.createWall(new Point(xIndent - (ResolutionManager.WALL_HEIGHT[this.RECT_NUM] >> 1), y),
                this.RAD_90, materialNum, this.RECT_NUM));
            arr.push(this.createWall(new Point(size.width - xIndent - ResolutionManager.WALL_WIDTH[this.RECT_NUM] +
                (ResolutionManager.WALL_HEIGHT[this.RECT_NUM] >> 1), y), this.RAD_90, materialNum, this.RECT_NUM));
        }
    }
    public static createWall(point: Point, angle: number, materialNum: number, shapeNum: number, hasMass: boolean = false) : WallElement {
        const mass = hasMass ? WALL_MASS[materialNum][shapeNum] : Infinity;
        const model = new WallModel(new RectangularEntity(point,
            ResolutionManager.WALL_WIDTH[shapeNum], ResolutionManager.WALL_HEIGHT[shapeNum], angle, mass, ModelIDTracker.wallId));

        const sprite = new WallSprite(materialNum, shapeNum);
        sprite.point = point;
        sprite.angle = angle;

        return new WallElement(model, sprite);
    }
}