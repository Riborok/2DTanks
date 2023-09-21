import {DoublyLinkedList, IDoublyLinkedList} from "../../additionally/data structures/IDoublyLinkedList";
import {TirePair} from "../../sprite/tank/tank effects/TankTireTrack";
import {Canvas} from "../Canvas";

export interface ITireTracksManager {
    get vanishingListOfTirePairs(): IDoublyLinkedList<TirePair>;
    reduceOpacity(): void;
}

export class TireTracksManager {
    private _vanishingListOfTirePairs : IDoublyLinkedList<TirePair> = new DoublyLinkedList<TirePair>()
    private static readonly MIN_REDUCING_OPACITY_NUMBER: number = 0.0001;
    private tanksAmount: number = 0;
    private _canvas: Canvas;
    public constructor(canvas: Canvas) { this._canvas = canvas }
    public get vanishingListOfTirePairs(): IDoublyLinkedList<TirePair> {
        this.tanksAmount++;
        return this._vanishingListOfTirePairs
    }
    private removeTireTrackPair(tireTrackPair: TirePair){
        this._canvas.remove(tireTrackPair.topTire);
        this._canvas.remove(tireTrackPair.bottomTire);
    }
    public reduceOpacity(): void {
        let counter = 0;
        for (const node of this._vanishingListOfTirePairs) {
            const reducingNumber = this._vanishingListOfTirePairs.length *
                TireTracksManager.MIN_REDUCING_OPACITY_NUMBER / this.tanksAmount;

            node.topTire.opacity -= reducingNumber;
            node.bottomTire.opacity -= reducingNumber;

            if (node.topTire.opacity <= 0) { counter++; }
        }
        for (; counter > 0; counter--) {
            this.removeTireTrackPair(this._vanishingListOfTirePairs.tail);
            this._vanishingListOfTirePairs.removeFromTail();
        }
    }
}
