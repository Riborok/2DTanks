import {DoubleLinkedList} from "../../additionally/DoubleLinkedList";
import {TirePair} from "../../sprite/tank/TankTireTrack";

export interface ITireTracksManager {
    get vanishingListOfTirePairs(): DoubleLinkedList<TirePair>;
    reduceOpacity(): void;
}

export class TireTracksManager {
    private _vanishingListOfTirePairs : DoubleLinkedList<TirePair> = new DoubleLinkedList<TirePair>()
    public get vanishingListOfTirePairs(): DoubleLinkedList<TirePair> { return this._vanishingListOfTirePairs }
    private removeTireTrackPair(tireTrackPair: TirePair){
        tireTrackPair.topTire.sprite.remove();
        tireTrackPair.bottomTire.sprite.remove();
    }
    public reduceOpacity(): void {
        let counter = 0;
        for (const node of this._vanishingListOfTirePairs) {
            node.topTire.reduceOpacity();
            node.topTire.setOpacity();
            node.bottomTire.reduceOpacity();
            node.bottomTire.setOpacity();

            if (node.topTire.opacity <= 0) { counter++; }
        }
        for (; counter > 0; counter--) {
            this.removeTireTrackPair(this._vanishingListOfTirePairs.head.value);
            this._vanishingListOfTirePairs.removeFromHead();
        }
    }
}
