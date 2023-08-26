import {Wall} from "../model/Wall";
import {Field} from "./Field";
import {IEntityStorage} from "../model/IEntityCollisionSystem";
import {MATERIAL, RECT_OBSTACLE_MASS, SQUARE_OBSTACLE_MASS} from "../constants/gameConstants";

export interface IObstacleCreator {
    createObstaclesAroundPerimeter(num: number): void;
    createRectObstacle(x: number, y: number, angle: number, num: number, hasMass: boolean): void;
    createSquareObstacle(x: number, y: number, angle: number, num: number, hasMass: boolean): void;
}

export class ObstacleCreator implements IObstacleCreator{
    private readonly _field: Field;
    private readonly _entityStorage: IEntityStorage;
    private static readonly INDENT: number = 10;
    private static readonly RECT_WALL_WIDTH: number = 101;
    private static readonly RECT_WALL_HEIGHT: number = 50;
    private static readonly SQUARE_WALL_SIZE: number = ObstacleCreator.RECT_WALL_HEIGHT;
    public constructor(field: Field, entityManager: IEntityStorage) {
        this._field = field;
        this._entityStorage = entityManager;
    }
    public createObstaclesAroundPerimeter(num: number) {
        const xIndent = ObstacleCreator.calculateIndent(this._field.width);
        const yIndent = ObstacleCreator.calculateIndent(this._field.height -
            (ObstacleCreator.RECT_WALL_HEIGHT << 1));

        this.createHorObstacles(num, xIndent, yIndent);
        this.createVertObstacles(num, xIndent, yIndent);
    }
    private static calculateIndent(totalLength: number): number {
        const currLength = totalLength - (ObstacleCreator.INDENT << 1);
        const indent = currLength - ObstacleCreator.RECT_WALL_WIDTH *
            Math.floor(currLength / ObstacleCreator.RECT_WALL_WIDTH);
        return (indent >> 1) + ObstacleCreator.INDENT;
    }
    private createHorObstacles(num: number, xIndent: number, yIndent: number) {
        for (let x = xIndent;
             x <= this._field.width - xIndent - ObstacleCreator.RECT_WALL_WIDTH; x += ObstacleCreator.RECT_WALL_WIDTH) {
            this.createRectObstacle(x, yIndent, 0, num);
            this.createRectObstacle(x, this._field.height - ObstacleCreator.RECT_WALL_HEIGHT - yIndent,
                0, num);
        }
    }
    private createVertObstacles(num: number, xIndent: number, yIndent: number) {
        const angle : number = 1.57; // 90 degrees

        for (let y = yIndent + ObstacleCreator.RECT_WALL_HEIGHT + (ObstacleCreator.RECT_WALL_HEIGHT >> 1);
             y <= this._field.height - yIndent - ObstacleCreator.RECT_WALL_WIDTH;
             y += ObstacleCreator.RECT_WALL_WIDTH) {
            this.createRectObstacle(xIndent - (ObstacleCreator.RECT_WALL_HEIGHT >> 1), y, angle, num);
            this.createRectObstacle(this._field.width - xIndent - ObstacleCreator.RECT_WALL_WIDTH +
                (ObstacleCreator.RECT_WALL_HEIGHT >> 1), y, angle, num);
        }
    }
    public createRectObstacle(x: number, y: number, angle: number, num: number, hasMass: boolean = false) {
        const obstacle = new Image(ObstacleCreator.RECT_WALL_WIDTH, ObstacleCreator.RECT_WALL_HEIGHT);
        obstacle.src = `src/img/blocks/${MATERIAL[num]}Rectangle.png`;
        obstacle.classList.add('sprite');
        obstacle.style.left = `${x}px`;
        obstacle.style.top = `${y}px`;
        obstacle.style.transform = `rotate(${angle}rad)`;
        obstacle.style.zIndex = `2`;
        const mass = hasMass ? RECT_OBSTACLE_MASS[num] : Infinity;
        this._entityStorage.insert(new Wall(x, y, ObstacleCreator.RECT_WALL_WIDTH,
            ObstacleCreator.RECT_WALL_HEIGHT, angle, mass));

        this._field.canvas.appendChild(obstacle);
    }
    public createSquareObstacle(x: number, y: number, angle: number, num: number, hasMass: boolean = false) {
        const obstacle = new Image(ObstacleCreator.SQUARE_WALL_SIZE, ObstacleCreator.SQUARE_WALL_SIZE);
        obstacle.src = `src/img/blocks/${MATERIAL[num]}Square.png`;
        obstacle.classList.add('sprite');
        obstacle.style.left = `${x}px`;
        obstacle.style.top = `${y}px`;
        obstacle.style.transform = `rotate(${angle}rad)`;
        obstacle.style.zIndex = `2`;
        const mass = hasMass ? SQUARE_OBSTACLE_MASS[num] : Infinity;
        this._entityStorage.insert(new Wall(x, y, ObstacleCreator.SQUARE_WALL_SIZE,
            ObstacleCreator.SQUARE_WALL_SIZE, angle, mass));

        this._field.canvas.appendChild(obstacle);
    }
}