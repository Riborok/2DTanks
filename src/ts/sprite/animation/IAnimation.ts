export interface IAnimation{
    get isEnded(): boolean;
    changeStage(deltaTime: number): void;
}