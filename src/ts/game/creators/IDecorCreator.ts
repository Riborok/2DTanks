import {SizeConstants} from "../../constants/gameConstants";
import {BackgroundSprite} from "../../sprite/background/BackgroundSprite";
import {Point} from "../../geometry/Point";

export class DecorCreator {
    private constructor() { }
    public static fullFillBackground(num: number, width: number, height: number, arr: Array<BackgroundSprite>)
    {
        for (let i: number = 0; i < width; i += SizeConstants.BACKGROUND_SIZE)
            for (let j: number = 0; j < height; j += SizeConstants.BACKGROUND_SIZE)
                arr.push(this.addBackgroundTile(new Point(i, j), num));
    }
    public static addBackgroundTile(point: Point, num: number): BackgroundSprite
    {
        const sprite = new BackgroundSprite(num);
        sprite.setPosition(point);
        return sprite;
    }
}