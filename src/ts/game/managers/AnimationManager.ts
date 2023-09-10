import {DoublyLinkedList, IDoublyLinkedList} from "../../additionally/data structures/IDoublyLinkedList";
import {IAnimation} from "../../sprite/animation/IAnimation";

interface IAnimationManager{
    add(animation: IAnimation): void;
    handle(): void;
}
export class AnimationManager implements IAnimationManager{
    private readonly _animationList: IDoublyLinkedList<IAnimation> = new DoublyLinkedList<IAnimation>();
    public add(animation: IAnimation): void {
        this._animationList.addToTail(animation);
    }
    public handle(): void {
        if (!this._animationList.isEmpty())
            this._animationList.applyAndRemove((animation: IAnimation) => animation.changeStage(),
                (animation: IAnimation) => !animation.isEnded);
    }
}