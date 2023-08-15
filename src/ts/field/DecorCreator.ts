import {CHUNK_SIZE} from "../constants";
import {getRandomInt} from "../additionalFunc";
import {Field} from "./Field";

export class DecorCreator {
    private _field: Field;
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
        const tile = document.createElement('img');
        tile.src = `src/img/backgrounds/${name}Background_${getRandomInt(0, 1)}.png`;
        tile.style.position = 'absolute';
        tile.style.left = `${x}px`;
        tile.style.top = `${y}px`;
        tile.style.width = `${CHUNK_SIZE}px`;
        tile.style.height = `${CHUNK_SIZE}px`;
        this._field.canvas.appendChild(tile);

        // ДЛЯ ТЕСТОВ
        tile.style.border = '1px solid black';
    }
}