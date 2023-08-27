import {binarySearchByField} from "../../additionally/additionalFunc";

export interface IIdentifiable {
    get id(): number;
}

export function findIndex(identifiable: IIdentifiable[], id: number): number {
    return binarySearchByField(identifiable, id, 'id', (a, b) => a - b);
}