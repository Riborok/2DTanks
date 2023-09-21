import {IIdentifiable} from "../../game/id/IIdentifiable";
import {ISprite} from "../Sprite";

export interface IAnimation extends IIdentifiable {
    get isEnded(): boolean;
    changeStage(deltaTime: number): void;
}

export interface IAnimationSprite extends IAnimation, ISprite {

}