import {DoublyLinkedList, IDoublyLinkedList} from "../../../additionally/data structures/IDoublyLinkedList";
import {AnimationSprite, IAnimation} from "../../../sprite/animation/IAnimation";
import {IStorageWithIdRemoval} from "../../processors/ICanvas";
import {IIdentifiable} from "../../id/IIdentifiable";
import {IExecutor} from "../../../additionally/type";

export interface IAnimationManager extends IExecutor {
    add(animation: IAnimation): void;
}
export class AnimationManager implements IAnimationManager{
    private readonly _animationList: IDoublyLinkedList<IAnimation> = new DoublyLinkedList<IAnimation>();
    private readonly _storage: IStorageWithIdRemoval<IIdentifiable>;
    public constructor(storage: IStorageWithIdRemoval<IIdentifiable>) {
        this._storage = storage;
    }
    public add(animationSprite: AnimationSprite): void {
        this._storage.insert(animationSprite);
        this._animationList.addToTail(animationSprite);
    }
    public handle(deltaTime: number): void {
        if (!this._animationList.isEmpty())
            this._animationList.applyAndRemove(this.action, this.removalCondition, deltaTime);
    }
    private readonly action = (animation: IAnimation, deltaTime: number) => animation.changeFrame(deltaTime);
    private readonly removalCondition = (animation: IAnimation) => {
        if (animation.isEnded) { this._storage.removeById(animation); }
        return animation.isEnded;
    }
}