export interface IIdToProcessing<T> {
    hasForProcessing(): boolean;
    clear(): void;
    push(t: T): void;
    get iterable(): Iterable<T>;
}

export class IdToProcessing<T> implements IIdToProcessing<T>{
    private readonly _idForProcessing: T[] = new Array<T>();
    public hasForProcessing(): boolean { return this._idForProcessing.length !== 0 }
    public clear() { this._idForProcessing.length = 0 }
    public push(t: T) { this._idForProcessing.push(t) }
    public get iterable(): Iterable<T> { return this._idForProcessing }
}