export interface IIdToProcessing {
    hasForProcessing(): boolean;
    clear(): void;
    push(id: number): void;
    get iterable(): Iterable<number>;
}

export class IdToProcessing implements IIdToProcessing{
    private readonly _idForProcessing: number[] = new Array<number>();
    public hasForProcessing(): boolean { return this._idForProcessing.length !== 0 }
    public clear() { this._idForProcessing.length = 0 }
    public push(id: number) { this._idForProcessing.push(id) }
    public get iterable(): Iterable<number> { return this._idForProcessing }
}