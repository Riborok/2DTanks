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

abstract class RectangularEntity implements IEntity {
    public points: Point[] = [];
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        const radAngle = angle * CONVERSION_TO_RADIANS;

        const widthCos = width * Math.cos(radAngle);
        const widthSin = width * Math.sin(radAngle);
        const heightCos = height * Math.cos(radAngle);
        const heightSin = height * Math.sin(radAngle);

        const firstPoint = new Point(x0, y0);
        const secondPoint = new Point(x0 + widthCos, y0 + widthSin);
        const thirdPoint = new Point(x0 + heightCos, y0 + heightSin);
        const fourthPoint = new Point(thirdPoint.x + widthCos, thirdPoint.y + widthSin);

        this.points = [firstPoint, secondPoint, thirdPoint, fourthPoint];
    }
}

abstract class Tank extends RectangularEntity {
    protected abstract readonly _angleSpeed: number;
    protected abstract readonly _moveSpeed: number;
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        super(x0, y0, width, height, angle);
    }

    public clockwiseMovement(step: number) {
        const angleRadians = step * CONVERSION_TO_RADIANS;
        const centerX = (this.points[0].x + this.points[1].x) >> 1;
        const centerY = (this.points[0].y + this.points[1].y) >> 1;

        for (const point of this.points) {
            const deltaX = point.x - centerX;
            const deltaY = point.y - centerY;
            const rotatedX = deltaX * Math.cos(angleRadians) - deltaY * Math.sin(angleRadians);
            const rotatedY = deltaX * Math.sin(angleRadians) + deltaY * Math.cos(angleRadians);
            point.x = rotatedX + centerX;
            point.y = rotatedY + centerY;
        }
    }
    public counterclockwiseMovement(step: number){ this.clockwiseMovement(-step); }

    public moveForward(step: number) {
        const { deltaX, deltaY } = this.calcDeltaCoordinates(step);
        for (const point of this.points) {
            point.x += deltaX;
            point.y += deltaY;
        }
    }
    public moveBackward(step: number) { this.moveForward(-step) }

    protected calcDeltaCoordinates(step: number): { deltaX: number, deltaY: number } {
        const angle = this.calcRadAngle();
        const deltaX = step * Math.cos(angle);
        const deltaY = step * Math.sin(angle);
        return { deltaX, deltaY };
    }

    protected calcRadAngle() {
        return Math.atan2(this.points[0].y - this.points[1].y,
            this.points[0].x - this.points[1].x);
    }
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

class Wall extends RectangularEntity {
    public constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        super(x0, y0, width, height, angle);
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
    const tile = document.createElement('img');
    tile.src = `./img/backgrounds/${name}Background.png`;
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
    const wallWidth = field.width - (INDENT << 1);
    const additionalIndent = wallWidth - RECT_WALL_WIDTH * Math.floor(wallWidth / RECT_WALL_WIDTH);
    for (let x = INDENT + (additionalIndent >> 1); x < field.width - INDENT - RECT_WALL_HEIGHT; x += RECT_WALL_WIDTH) {
        createRectObstacleHor(x, INDENT, name, field);
        createRectObstacleHor(x , field.height - RECT_WALL_HEIGHT - INDENT, name, field);
    }

    for (let y = INDENT + RECT_WALL_HEIGHT + (RECT_WALL_HEIGHT >> 1); y < field.height - INDENT - RECT_WALL_HEIGHT; y += RECT_WALL_WIDTH) {
        createRectObstacleVert(INDENT - (RECT_WALL_HEIGHT >> 1), y, name, field);
        createRectObstacleVert(field.width - RECT_WALL_WIDTH - INDENT + (RECT_WALL_HEIGHT >> 1), y, name, field);
    }
}
function createSquareObstacle(x: number, y: number, name: string, field: Field) {
    const obstacle = document.createElement('img');
    obstacle.src = `./img/blocks/${name}Square.png`;
    obstacle.style.position = 'absolute';
    obstacle.style.left = `${x}px`;
    obstacle.style.bottom = `${y}px`;
    obstacle.style.width = `${SQUARE_WALL_SIZE}px`;
    obstacle.style.height = `${SQUARE_WALL_SIZE}px`;
    field.addObject(new Wall(x, y, SQUARE_WALL_SIZE, SQUARE_WALL_SIZE, 0));

    field.canvas.appendChild(obstacle);
}
function createRectObstacleHor(x: number, y: number, name: string, field: Field) {
    const obstacle = document.createElement('img');
    obstacle.src = `./img/blocks/${name}Rectangle.png`;
    obstacle.style.position = 'absolute';
    obstacle.style.left = `${x}px`;
    obstacle.style.bottom = `${y}px`;
    obstacle.style.width = `${RECT_WALL_WIDTH}px`;
    obstacle.style.height = `${RECT_WALL_HEIGHT}px`;
    field.addObject(new Wall(x, y, RECT_WALL_WIDTH, RECT_WALL_HEIGHT, 0));

    field.canvas.appendChild(obstacle);
}
function createRectObstacleVert(x: number, y: number, name: string, field: Field) {
    const angle: number = 90;
    const obstacle = document.createElement('img');
    obstacle.src = `./img/blocks/${name}Rectangle.png`;
    obstacle.style.position = 'absolute';
    obstacle.style.left = `${x}px`;
    obstacle.style.bottom = `${y}px`;
    obstacle.style.width = `${RECT_WALL_WIDTH}px`;
    obstacle.style.height = `${RECT_WALL_HEIGHT}px`;
    obstacle.style.transform = `rotate(${angle}deg)`;
    field.addObject(new Wall(x + (RECT_WALL_WIDTH >> 1) + (RECT_WALL_HEIGHT >> 1),
        y - (RECT_WALL_WIDTH >> 1) + (RECT_WALL_HEIGHT >> 1),
        RECT_WALL_WIDTH, RECT_WALL_HEIGHT, angle));

    field.canvas.appendChild(obstacle);
}









/*
abstract class Tank {
    private readonly _model : any;
    private _x: number;
    private _y: number;
    private _angle: number;
    protected abstract readonly _angleSpeed: number;
    protected abstract readonly _moveSpeed: number;
    protected constructor(model: any, x: number, y: number, angle: number) {
        this._model = model;
        this._x = x;
        this._y = y;
        this._angle = angle;

        this.updatePosition();
        this.updateAngle();
    }
    public moveForward() {
        const radian = this._angle * CONVERSION_TO_RADIANS;
        this._x += this._moveSpeed * Math.cos(radian);
        this._y += this._moveSpeed * Math.sin(radian);

        this.updatePosition();
    }

    public moveBackward() {
        const radian = this._angle * CONVERSION_TO_RADIANS;
        this._x -= this._moveSpeed * Math.cos(radian);
        this._y -= this._moveSpeed * Math.sin(radian);

        this.updatePosition();
    }

    private updatePosition() {
        this._model.style.left = `${this._x}px`;
        this._model.style.top = `${this._y}px`;
    }

    private updateAngle() {
        this._model.style.transform = `rotate(${this._angle}deg)`;
    }

    public get x(): number { return this._x }
    public get y(): number { return this._y }

    public clockwiseMovement() {
        this._angle += this._angleSpeed;
        this.updateAngle();
    }
    public counterclockwiseMovement(){
        this._angle -= this._angleSpeed;
        this.updateAngle();
    }
}
class DefaultTank extends Tank {
    protected readonly _moveSpeed: number;
    protected readonly _angleSpeed: number;
    constructor(model: any, x: number, y: number, angle: number) {
        super(model, x, y, angle);
        this._moveSpeed = 5;
        this._angleSpeed = 5;
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

