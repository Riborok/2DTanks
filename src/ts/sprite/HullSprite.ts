class HullSprite extends Sprite {
    public static readonly WIDTH: number[] = [93, 100, 93, 79, 100, 100, 93, 86];
    public static readonly HEIGHT: number[] = [64, 64, 50, 43, 71, 57, 50, 43];
    public constructor(color: number, num: number) {
        super();
        this._sprite.src = `src/img/tanks/Hulls/Hull_${num}/Hull_${color}.png`;
        this._sprite.style.width = `${HullSprite.WIDTH[num]}px`;
        this._sprite.style.height = `${HullSprite.HEIGHT[num]}px`;
    }
}