export interface IAnimation{
    get isEnded(): boolean;
    changeStage(): void;
    remove(): void;
}