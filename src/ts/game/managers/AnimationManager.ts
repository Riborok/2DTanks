import {DoublyLinkedList, IDoublyLinkedList} from "../../additionally/data structures/IDoublyLinkedList";
import {IAnimation, IAnimationSprite} from "../../sprite/animation/IAnimation";
import {IExecutioner} from "./handling managers/HandlingManager";
import {Canvas} from "../Canvas";

export interface IAnimationManager extends IExecutioner {
    add(animation: IAnimation): void;
}
export class AnimationManager implements IAnimationManager{
    private readonly _animationList: IDoublyLinkedList<IAnimation> = new DoublyLinkedList<IAnimation>();
    private readonly _canvas: Canvas;
    public constructor(canvas: Canvas) {
        this._canvas = canvas;
    }
    public add(animation: IAnimationSprite): void {
        this._canvas.insert(animation);
        this._animationList.addToTail(animation);
    }
    public handle(deltaTime: number): void {
        if (!this._animationList.isEmpty())
            this._animationList.applyAndRemove(
                (animation: IAnimation, deltaTime: number) => animation.changeStage(deltaTime),
                this.removalCondition.bind(this), deltaTime
            );
    }
    private removalCondition(animation: IAnimation) {
        if (animation.isEnded)
            this._canvas.remove(animation);
        return animation.isEnded;
    }
}