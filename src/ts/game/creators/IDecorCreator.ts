import {ResolutionManager} from "../../constants/gameConstants";
import {BackgroundSprite} from "../../sprite/background/BackgroundSprite";
import {Point} from "../../geometry/Point";
import {Size} from "../../additionally/type";

export class DecorCreator {
    private constructor() { }
    public static fullFillBackground(num: number, size: Size, arr: Array<BackgroundSprite>)
    {
        for (let i: number = 0; i < size.width; i += ResolutionManager.BACKGROUND_SIZE)
            for (let j: number = 0; j < size.height; j += ResolutionManager.BACKGROUND_SIZE)
                arr.push(this.addBackgroundTile(new Point(i, j), num));
    }
    public static addBackgroundTile(point: Point, num: number): BackgroundSprite
    {
        const sprite = new BackgroundSprite(num);
        sprite.setPosition(point);
        return sprite;
    }
}