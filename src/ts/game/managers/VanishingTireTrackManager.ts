import {DoubleLinkedList} from "../../additionally/DoubleLinkedList";
import {TirePair} from "./TankTireTrackManager";

export class VanishingTireTracksManager {
    private static _vanishingListOfTirePairs : DoubleLinkedList<TirePair> = new DoubleLinkedList<TirePair>()
    public static getVanishingListOfTirePairs(): DoubleLinkedList<TirePair> {
        return VanishingTireTracksManager._vanishingListOfTirePairs;
    }
    private static removeTireTrackPair(tireTrackPair: TirePair){
        tireTrackPair.topTire.sprite.remove();
        tireTrackPair.bottomTire.sprite.remove();
    }
    public static reduceOpacity(): void {
        let counter = 0;
        for (const node of VanishingTireTracksManager._vanishingListOfTirePairs) {
            node.topTire.reduceOpacity();
            node.topTire.setOpacity();
            node.bottomTire.reduceOpacity();
            node.bottomTire.setOpacity();

            if (node.topTire.opacity <= 0) { counter++ }
        }
        for (; counter > 0; counter--) {
            this.removeTireTrackPair(VanishingTireTracksManager._vanishingListOfTirePairs.head.value);
            VanishingTireTracksManager._vanishingListOfTirePairs.removeFromHead();
        }
    }
}
