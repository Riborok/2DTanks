import {binarySearch} from "../../additionally/additionalFunc";

export interface IIdentifiable {
    get id(): number;
}

export function findIndex(identifiable: IIdentifiable[], id: number): number {
    return binarySearch(identifiable, { id }, (a: IIdentifiable, b: IIdentifiable) => a.id - b.id);
}