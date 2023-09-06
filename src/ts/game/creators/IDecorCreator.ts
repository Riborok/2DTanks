import {BACKGROUND_SIZE} from "../../constants/gameConstants";
import {BackgroundSprite} from "../../sprite/background/BackgroundSprite";
import {Point} from "../../geometry/Point";
import {ILinkedList} from "../../additionally/ILinkedList";

export class DecorCreator {
    private constructor() { }
    public static fullFillBackground(num: number, width: number, height: number, list: ILinkedList<BackgroundSprite>)
    {
        for (let i: number = 0; i < width; i += BACKGROUND_SIZE)
            for (let j: number = 0; j < height; j += BACKGROUND_SIZE)
                list.addToHead(this.addBackgroundTile(new Point(i, j), num));
    }
    public static addBackgroundTile(point: Point, num: number): BackgroundSprite
    {
        const sprite = new BackgroundSprite(num);
        sprite.setPosition(point);
        return sprite;
    }
}