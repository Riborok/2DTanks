import {IExecutor} from "../../additionally/type";

export interface IRender {
    add(...executioner:  IExecutor[]): void;
    renderAll(deltaTime: number): void;
}

export class Render implements IRender {
    private readonly _executioners: IExecutor[] = new Array<IExecutor>();
    public add(...executioner:  IExecutor[]) {
        this._executioners.push(...executioner);
    }
    public renderAll(deltaTime: number) {
        for (const executioner of this._executioners)
            executioner.handle(deltaTime);
    }
}