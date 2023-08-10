// Constants
const VK_W: number = 87;
const VK_S: number = 83;
const VK_A: number = 65;
const VK_D: number = 68;

const CONVERSION_TO_RADIANS: number = Math.PI / 180;

const CHUNK_SIZE: number = 115;

const INDENT: number = 10;
const RECT_WALL_WIDTH: number = 101;
const RECT_WALL_HEIGHT: number = 50;
const SQUARE_WALL_SIZE: number = RECT_WALL_HEIGHT;

// Interfaces and Abstraction
interface IEntity {
    points: Point[];
}

// Classes
class Point {
    public x: number;
    public y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Rectangle implements IEntity {
    public points: Point[] = [];
    public constructor(x0: number, y0: number, width: number, height: number, slope: number) {
        this.points = [
            new Point(x0, y0),
            new Point(x0 + width * Math.cos(slope * CONVERSION_TO_RADIANS), y0 + width * Math.sin(slope * CONVERSION_TO_RADIANS)),
            new Point(x0 + height * Math.cos(slope * CONVERSION_TO_RADIANS), y0 + height * Math.sin(slope * CONVERSION_TO_RADIANS)),
        ];
        this.points.push(
            new Point(this.points[2].x + width * Math.cos(slope * CONVERSION_TO_RADIANS), this.points[2].y + width * Math.sin(slope * CONVERSION_TO_RADIANS))
        );
    }
}

class Field {
    private readonly _entities: IEntity[][][];
    public readonly canvas: any;
    public readonly width: number;
    public readonly height: number;
    constructor(canvas: any, width: number, height: number) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this._entities = [];
        for (let i = 0; i < Math.ceil(width / CHUNK_SIZE); i++) {
            this._entities[i] = [];
            for (let j = 0; j < Math.ceil(height / CHUNK_SIZE); j++) {
                this._entities[i][j] = [];
            }
        }
    }

    public addObject(entity: IEntity) {
        for (const point of entity.points) {
            const chunkX = Math.floor(point.x / CHUNK_SIZE);
            const chunkY = Math.floor(point.y / CHUNK_SIZE);
            if (this._entities[chunkX][chunkY][this._entities[chunkX][chunkY].length - 1] !== entity) {
                this._entities[chunkX][chunkY].push(entity);
            }
        }
    }
}

// Functions
function fullFillBackGround(name: string, field: Field)
{
    field.canvas.style.overflow = 'hidden';
    for (let i: number = 0; i < field.width; i += CHUNK_SIZE)
        for (let j: number = 0; j < field.height; j += CHUNK_SIZE)
            addBackgroundTile(i, j, name, field);
}
function addBackgroundTile(x: number, y: number, name: string, field: Field)
{
    let tile = document.createElement('img');
    tile.src = `./img/background/${name}Background.png`;
    tile.style.position = 'absolute';
    tile.style.left = `${x}px`;
    tile.style.bottom = `${y}px`;
    tile.style.width = `${CHUNK_SIZE}px`;
    tile.style.height = `${CHUNK_SIZE}px`;
    field.canvas.appendChild(tile);

    // ДЛЯ ТЕСТОВ
    tile.style.border = '1px solid black';
}

function createObstacles(name: string, field: Field) {

    for (let x = INDENT; x < field.width - INDENT - RECT_WALL_HEIGHT; x += RECT_WALL_WIDTH) {
        createRectObstacleHor(x, INDENT, name, field);
        createRectObstacleHor(x , field.height - RECT_WALL_HEIGHT - INDENT, name, field);
    }

    for (let y = INDENT + RECT_WALL_HEIGHT + (RECT_WALL_HEIGHT >> 1); y < field.height - INDENT - RECT_WALL_HEIGHT; y += RECT_WALL_WIDTH) {
        createRectObstacleVert(INDENT - (RECT_WALL_HEIGHT >> 1), y, name, field);
        createRectObstacleVert(field.width - RECT_WALL_WIDTH - INDENT + (RECT_WALL_HEIGHT >> 1), y, name, field);
    }
}
function createSquareObstacle(x: number, y: number, name: string, field: Field) {
    let obstacle = document.createElement('img');
    obstacle.src = `./img/blocks/${name}Square.png`;
    obstacle.style.position = 'absolute';
    obstacle.style.left = `${x}px`;
    obstacle.style.bottom = `${y}px`;
    obstacle.style.width = `${SQUARE_WALL_SIZE}px`;
    obstacle.style.height = `${SQUARE_WALL_SIZE}px`;
    field.addObject(new Rectangle(x, y, SQUARE_WALL_SIZE, SQUARE_WALL_SIZE, 0));

    field.canvas.appendChild(obstacle);
}
function createRectObstacleHor(x: number, y: number, name: string, field: Field) {
    let obstacle = document.createElement('img');
    obstacle.src = `./img/blocks/${name}Rectangle.png`;
    obstacle.style.position = 'absolute';
    obstacle.style.left = `${x}px`;
    obstacle.style.bottom = `${y}px`;
    obstacle.style.width = `${RECT_WALL_WIDTH}px`;
    obstacle.style.height = `${RECT_WALL_HEIGHT}px`;
    field.addObject(new Rectangle(x, y, RECT_WALL_WIDTH, RECT_WALL_HEIGHT, 0));

    field.canvas.appendChild(obstacle);
}
function createRectObstacleVert(x: number, y: number, name: string, field: Field) {
    const slope: number = 90;
    let obstacle = document.createElement('img');
    obstacle.src = `./img/blocks/${name}Rectangle.png`;
    obstacle.style.position = 'absolute';
    obstacle.style.left = `${x}px`;
    obstacle.style.bottom = `${y}px`;
    obstacle.style.width = `${RECT_WALL_WIDTH}px`;
    obstacle.style.height = `${RECT_WALL_HEIGHT}px`;
    obstacle.style.transform = `rotate(${slope}deg)`;
    field.addObject(new Rectangle(x + (RECT_WALL_WIDTH >> 1) + (RECT_WALL_HEIGHT >> 1),
        y - (RECT_WALL_WIDTH >> 1) + (RECT_WALL_HEIGHT >> 1),
        RECT_WALL_WIDTH, RECT_WALL_HEIGHT, slope));

    field.canvas.appendChild(obstacle);
}









/*
abstract class Tank {
    private readonly _model : any;
    private _x: number;
    private _y: number;
    private _slope: number;
    protected abstract readonly _slopeSpeed: number;
    protected abstract readonly _moveSpeed: number;
    protected constructor(model: any, x: number, y: number, slope: number) {
        this._model = model;
        this._x = x;
        this._y = y;
        this._slope = slope;

        this.updatePosition();
        this.updateSlope();
    }
    public moveForward() {
        const radian = this._slope * CONVERSION_TO_RADIANS;
        this._x += this._moveSpeed * Math.cos(radian);
        this._y += this._moveSpeed * Math.sin(radian);

        this.updatePosition();
    }

    public moveBackward() {
        const radian = this._slope * CONVERSION_TO_RADIANS;
        this._x -= this._moveSpeed * Math.cos(radian);
        this._y -= this._moveSpeed * Math.sin(radian);

        this.updatePosition();
    }

    private updatePosition() {
        this._model.style.left = `${this._x}px`;
        this._model.style.top = `${this._y}px`;
    }

    private updateSlope() {
        this._model.style.transform = `rotate(${this._slope}deg)`;
    }

    public get x(): number { return this._x }
    public get y(): number { return this._y }

    public clockwiseMovement() {
        this._slope += this._slopeSpeed;
        this.updateSlope();
    }
    public counterclockwiseMovement(){
        this._slope -= this._slopeSpeed;
        this.updateSlope();
    }
}
class DefaultTank extends Tank {
    protected readonly _moveSpeed: number;
    protected readonly _slopeSpeed: number;
    constructor(model: any, x: number, y: number, slope: number) {
        super(model, x, y, slope);
        this._moveSpeed = 5;
        this._slopeSpeed = 5;
    }
}


// Кривулька
let defTank : DefaultTank = null;
function createTank(tank: any) {
    defTank = new DefaultTank(tank, 20, 20, 0)
}
function handleKeys(keysPressed: any) {
    let keyCode = keysPressed.keyCode;
    switch (keyCode) {
        case VK_W:
            defTank.moveForward();
            break;
        case VK_S:
            defTank.moveBackward();
            break;
        case VK_D:
            defTank.clockwiseMovement();
            break;
        case VK_A:
            defTank.counterclockwiseMovement();
            break;
    }
}
 */

