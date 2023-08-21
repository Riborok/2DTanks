import {Wall} from "../model/Wall";
import {Field} from "./Field";
import {IRectangularEntityStorage} from "../model/IRectangularEntityStorage";

export interface IObstacleCreator {
    createObstaclesAroundPerimeter(name: string): void;
    createRectObstacle(x: number, y: number, name: string, angle: number): void;
    createSquareObstacle(x: number, y: number, name: string, angle: number): void;
}

export class ObstacleCreator implements IObstacleCreator{
    private readonly _field: Field;
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    private static readonly INDENT: number = 10;
    private static readonly RECT_WALL_WIDTH: number = 101;
    private static readonly RECT_WALL_HEIGHT: number = 50;
    private static readonly SQUARE_WALL_SIZE: number = ObstacleCreator.RECT_WALL_HEIGHT;
    public constructor(field: Field, entityManager: IRectangularEntityStorage) {
        this._field = field;
        this._rectangularEntityStorage = entityManager;
    }
    public createObstaclesAroundPerimeter(name: string) {
        const xIndent = ObstacleCreator.calculateIndent(this._field.width);
        const yIndent = ObstacleCreator.calculateIndent(this._field.height -
            (ObstacleCreator.RECT_WALL_HEIGHT << 1));

        this.createHorObstacles(name, xIndent, yIndent);
        this.createVertObstacles(name, xIndent, yIndent);
    }
    private static calculateIndent(totalLength: number): number {
        const currLength = totalLength - (ObstacleCreator.INDENT << 1);
        const indent = currLength - ObstacleCreator.RECT_WALL_WIDTH *
            Math.floor(currLength / ObstacleCreator.RECT_WALL_WIDTH);
        return (indent >> 1) + ObstacleCreator.INDENT;
    }
    private createHorObstacles(name: string, xIndent: number, yIndent: number) {
        for (let x = xIndent;
             x <= this._field.width - xIndent - ObstacleCreator.RECT_WALL_WIDTH; x += ObstacleCreator.RECT_WALL_WIDTH) {
            this.createRectObstacle(x, yIndent, name, 0);
            this.createRectObstacle(x, this._field.height - ObstacleCreator.RECT_WALL_HEIGHT - yIndent, name, 0);
        }
    }
    private createVertObstacles(name: string, xIndent: number, yIndent: number) {
        const angle : number = 1.57; // 90 degrees

        for (let y = yIndent + ObstacleCreator.RECT_WALL_HEIGHT + (ObstacleCreator.RECT_WALL_HEIGHT >> 1);
             y <= this._field.height - yIndent - ObstacleCreator.RECT_WALL_WIDTH;
             y += ObstacleCreator.RECT_WALL_WIDTH) {
            this.createRectObstacle(xIndent - (ObstacleCreator.RECT_WALL_HEIGHT >> 1), y, name, angle);
            this.createRectObstacle(this._field.width - xIndent - ObstacleCreator.RECT_WALL_WIDTH +
                (ObstacleCreator.RECT_WALL_HEIGHT >> 1),
                y, name, angle);
        }
    }
    public createRectObstacle(x: number, y: number, name: string, angle: number) {
        const obstacle = new Image(ObstacleCreator.RECT_WALL_WIDTH, ObstacleCreator.RECT_WALL_HEIGHT);
        obstacle.src = `src/img/blocks/${name}Rectangle.png`;
        obstacle.classList.add('sprite');
        obstacle.style.left = `${x}px`;
        obstacle.style.top = `${y}px`;
        obstacle.style.transform = `rotate(${angle}rad)`;
        this._rectangularEntityStorage.insert(new Wall(x, y, ObstacleCreator.RECT_WALL_WIDTH,
            ObstacleCreator.RECT_WALL_HEIGHT, angle));

        this._field.canvas.appendChild(obstacle);
    }
    public createSquareObstacle(x: number, y: number, name: string, angle: number) {
        const obstacle = new Image(ObstacleCreator.SQUARE_WALL_SIZE, ObstacleCreator.SQUARE_WALL_SIZE);
        obstacle.src = `src/img/blocks/${name}Square.png`;
        obstacle.classList.add('sprite');
        obstacle.style.left = `${x}px`;
        obstacle.style.top = `${y}px`;
        obstacle.style.transform = `rotate(${angle}rad)`;
        this._rectangularEntityStorage.insert(new Wall(x, y, ObstacleCreator.SQUARE_WALL_SIZE,
            ObstacleCreator.SQUARE_WALL_SIZE, angle));

        this._field.canvas.appendChild(obstacle);
    }
}