interface IVanishing{
    isVanished(): boolean;
    reduceOpacity(reduceNumber: number): void;
    setOpacity(): void;
    removeSprite(): void;
}