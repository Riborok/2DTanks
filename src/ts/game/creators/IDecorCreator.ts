import {getRandomInt} from "../../additionally/additionalFunc";
import {Field} from "../Field";
import {BACKGROUND_SIZE, MATERIAL} from "../../constants/gameConstants";
import {BackgroundSprite} from "../../sprite/background/BackgroundSprite";
import {Point} from "../../geometry/Point";

export class DecorCreator {
    private constructor() { }
    public static fullFillBackground(num: number, width: number, height: number): BackgroundSprite[]
    {
        const result: BackgroundSprite[] = [];
        for (let i: number = 0; i < width; i += BACKGROUND_SIZE)
            for (let j: number = 0; j < height; j += BACKGROUND_SIZE)
                result.push(this.addBackgroundTile(i, j, num));
        return result;
    }
    public static addBackgroundTile(x: number, y: number, num: number): BackgroundSprite
    {
        const sprite = new BackgroundSprite(num);
        sprite.setPosition(new Point(x, y));
        return sprite;
    }
}