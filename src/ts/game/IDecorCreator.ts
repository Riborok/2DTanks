import {CHUNK_SIZE} from "../constants";
import {getRandomInt} from "../additionalFunc";
import {Field} from "./Field";

export interface IDecorCreator {
    fullFillBackground(name: string): void;
    addBackgroundTile(x: number, y: number, name: string): void;
}

export class DecorCreator implements IDecorCreator {
    private readonly _field: Field;
    public constructor(field: Field) {
        this._field = field;
    }
    public fullFillBackground(name: string)
    {
        for (let i: number = 0; i < this._field.width; i += CHUNK_SIZE)
            for (let j: number = 0; j < this._field.height; j += CHUNK_SIZE)
                this.addBackgroundTile(i, j, name);
    }
    public addBackgroundTile(x: number, y: number, name: string)
    {
        const tile = new Image(CHUNK_SIZE, CHUNK_SIZE);
        tile.src = `src/img/backgrounds/${name}Background_${getRandomInt(0, 1)}.png`;
        tile.classList.add('sprite');
        tile.style.left = `${x}px`;
        tile.style.top = `${y}px`;
        this._field.canvas.appendChild(tile);
    }
}