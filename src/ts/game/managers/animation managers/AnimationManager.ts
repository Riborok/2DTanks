import {DoublyLinkedList, IDoublyLinkedList} from "../../../additionally/data structures/IDoublyLinkedList";
import {IAnimation, IAnimationSprite} from "../../../sprite/animation/IAnimation";
import {IExecutioner} from "../handling managers/HandlingManager";
import {IStorageWithIdRemoval} from "../../ICanvas";
import {ISprite} from "../../../sprite/Sprite";

export interface IAnimationManager extends IExecutioner {
    add(animation: IAnimation): void;
}
export class AnimationManager implements IAnimationManager{
    private readonly _animationList: IDoublyLinkedList<IAnimation> = new DoublyLinkedList<IAnimation>();
    private readonly _storage: IStorageWithIdRemoval<ISprite>;
    public constructor(storage: IStorageWithIdRemoval<ISprite>) {
        this._storage = storage;
    }
    public add(animationSprite: IAnimationSprite): void {
        this._storage.insert(animationSprite);
        this._animationList.addToTail(animationSprite);
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
            this._storage.removeById(animation);
        return animation.isEnded;
    }
}