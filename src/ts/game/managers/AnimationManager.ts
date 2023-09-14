import {DoublyLinkedList, IDoublyLinkedList} from "../../additionally/data structures/IDoublyLinkedList";
import {IAnimation} from "../../sprite/animation/IAnimation";

export interface IAnimationManager{
    add(animation: IAnimation): void;
    handle(deltaTime: number): void;
}
export class AnimationManager implements IAnimationManager{
    private readonly _animationList: IDoublyLinkedList<IAnimation> = new DoublyLinkedList<IAnimation>();
    public add(animation: IAnimation): void {
        this._animationList.addToTail(animation);
    }
    public handle(deltaTime: number): void {
        if (!this._animationList.isEmpty())
            this._animationList.applyAndRemove(
                (animation: IAnimation, deltaTime: number) => animation.changeStage(deltaTime),
                (animation: IAnimation) => !animation.isEnded, deltaTime
            );
    }
}