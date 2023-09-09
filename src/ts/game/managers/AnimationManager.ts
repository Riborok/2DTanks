import {DoubleLinkedList} from "../../additionally/data structures/IDoubleLinkedList";
import {IAnimation} from "../../sprite/animation/IAnimation";

interface IAnimationManager{
    get animationList(): DoubleLinkedList<IAnimation>;
    handleAnimations(): void;
}
export class AnimationManager implements IAnimationManager{
    private _animationList: DoubleLinkedList<IAnimation> = new DoubleLinkedList<IAnimation>();
    get animationList(): DoubleLinkedList<IAnimation> { return this._animationList }
    public handleAnimations(): void {
        for (const node of this._animationList){
            node.changeStage();
            if (node.isEnded) {
                node.remove();
                this._animationList.remove(node);
            }
        }
    }
}