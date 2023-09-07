import {Sprite} from "../Sprite";

export class SpriteAcceleration extends Sprite {
    private static readonly DEFAULT_SRC : string = 'src/img/tanks/Effects/Movement/Movement_';
    private static readonly SRC: string[] = [
        `${this.DEFAULT_SRC}0.png`,
        `${this.DEFAULT_SRC}1.png`,
        `${this.DEFAULT_SRC}2.png`,
        `${this.DEFAULT_SRC}3.png`,
        `${this.DEFAULT_SRC}4.png`,
        `${this.DEFAULT_SRC}5.png`,
        `${this.DEFAULT_SRC}6.png`,
        `${this.DEFAULT_SRC}7.png`,
        `${this.DEFAULT_SRC}8.png`,
        `${this.DEFAULT_SRC}9.png`,
        `${this.DEFAULT_SRC}10.png`,
        `${this.DEFAULT_SRC}11.png`,
        `${this.DEFAULT_SRC}12.png`,
        `${this.DEFAULT_SRC}13.png`,
        `${this.DEFAULT_SRC}14.png`,
        `${this.DEFAULT_SRC}15.png`,
        `${this.DEFAULT_SRC}16.png`,
        `${this.DEFAULT_SRC}17.png`,
        `${this.DEFAULT_SRC}18.png`,
        `${this.DEFAULT_SRC}19.png`
    ];
    public static readonly SIZE: number = 85;
    public constructor() {
        super(SpriteAcceleration.SIZE, SpriteAcceleration.SIZE);
        this._sprite.style.zIndex = `4`;
        this._sprite.src = SpriteAcceleration.SRC[0];
    }
    public setSrc(state: number) {
        this._sprite.src = SpriteAcceleration.SRC[state];
    }
}