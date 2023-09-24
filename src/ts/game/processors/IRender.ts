import {IExecutioner} from "../../additionally/type";

export interface IRender {
    add(...executioner:  IExecutioner[]): void;
    renderAll(deltaTime: number): void;
}

export class Render implements IRender {
    private readonly _executioners: IExecutioner[] = new Array<IExecutioner>();
    public add(...executioner:  IExecutioner[]) {
        this._executioners.push(...executioner);
    }
    public renderAll(deltaTime: number) {
        for (const executioner of this._executioners)
            executioner.handle(deltaTime);
    }
}