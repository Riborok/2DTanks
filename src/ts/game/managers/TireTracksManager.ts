import {DoublyLinkedList, IDoublyLinkedList} from "../../additionally/data structures/IDoublyLinkedList";
import {TirePair} from "../../sprite/tank/tank effects/TankTireTrack";

export interface ITireTracksManager {
    get vanishingListOfTirePairs(): IDoublyLinkedList<TirePair>;
    reduceOpacity(): void;
}

export class TireTracksManager {
    private _vanishingListOfTirePairs : IDoublyLinkedList<TirePair> = new DoublyLinkedList<TirePair>()
    private static readonly MIN_REDUCING_OPACITY_NUMBER: number = 0.0001;
    private tanksAmount: number = 0;
    public get vanishingListOfTirePairs(): IDoublyLinkedList<TirePair> {
        this.tanksAmount++;
        return this._vanishingListOfTirePairs
    }
    private removeTireTrackPair(tireTrackPair: TirePair){
        tireTrackPair.topTire.remove();
        tireTrackPair.bottomTire.remove();
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
            this.removeTireTrackPair(this._vanishingListOfTirePairs.tail);
            this._vanishingListOfTirePairs.removeFromTail();
        }
    }
}
