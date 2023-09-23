import {ResolutionManager} from "../../constants/gameConstants";
import {BackgroundSprite} from "../../sprite/background/BackgroundSprite";
import {Point} from "../../geometry/Point";
import {IStorage, Size} from "../../additionally/type";
import {ISprite} from "../../sprite/ISprite";

export class DecorCreator {
    private constructor() { }
    public static fullFillBackground(num: number, size: Size, storage: IStorage<ISprite>)
    {
        for (let i: number = 0; i < size.width; i += ResolutionManager.BACKGROUND_SIZE)
            for (let j: number = 0; j < size.height; j += ResolutionManager.BACKGROUND_SIZE)
                storage.insert(this.addBackgroundTile(new Point(i, j), num));
    }
    public static addBackgroundTile(point: Point, num: number): BackgroundSprite
    {
        const sprite = new BackgroundSprite(num);
        sprite.point = point;
        return sprite;
    }
}