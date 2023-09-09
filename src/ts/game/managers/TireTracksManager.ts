import {DoubleLinkedList, IDoubleLinkedList} from "../../additionally/data structures/IDoubleLinkedList";
import {TirePair} from "../../sprite/tank/tank effects/TankTireTrack";
import {Sprite} from "../../sprite/Sprite";

export interface ITireTracksManager {
    get vanishingListOfTirePairs(): IDoubleLinkedList<TirePair>;
    reduceOpacity(): void;
}

export class TireTracksManager {
    private _vanishingListOfTirePairs : IDoubleLinkedList<TirePair> = new DoubleLinkedList<TirePair>()
    private static readonly MIN_REDUCING_OPACITY_NUMBER: number = 0.0001;
    private tanksAmount: number = 0;
    public get vanishingListOfTirePairs(): IDoubleLinkedList<TirePair> {
        this.tanksAmount++;
        return this._vanishingListOfTirePairs
    }
    private removeTireTrackPair(tireTrackPair: TirePair){
        tireTrackPair.topTire.removeSprite();
        tireTrackPair.bottomTire.removeSprite();
    }
    public reduceOpacity(): void {
        let counter = 0;
        for (const node of this._vanishingListOfTirePairs) {
            const reducingNumber = this._vanishingListOfTirePairs.length *
                TireTracksManager.MIN_REDUCING_OPACITY_NUMBER / this.tanksAmount;
            node.topTire.reduceOpacity(reducingNumber);
            node.topTire.setOpacity();
            node.bottomTire.reduceOpacity(reducingNumber);
            node.bottomTire.setOpacity();

            if (node.topTire.isVanished()) { counter++; }
        }
        for (; counter > 0; counter--) {
            this.removeTireTrackPair(this._vanishingListOfTirePairs.tail.value);
            this._vanishingListOfTirePairs.removeFromTail();
        }
    }
}
