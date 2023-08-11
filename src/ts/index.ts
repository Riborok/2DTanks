// Constants
const VK_W: number = 87;
const VK_S: number = 83;
const VK_A: number = 65;
const VK_D: number = 68;

const CONVERSION_TO_RADIANS: number = Math.PI / 180;
const CHUNK_SIZE: number = 115;
const MATERIAL: string[] = ['Grass', 'Ground', 'Sandstone'];

// Interfaces and Abstraction
interface IEntity {
    get points(): Point[];
}

interface ITrack {
    get moveSpeed(): number;
    get angleSpeed(): number;
}

interface IBullet {
    get angle(): number;
    get moveSpeed(): number;
    get damage(): number;
    get armorPenetration(): number;

    set moveSpeed(newMoveSpeed: number);
    set damage(newDamage: number);
    set armorPenetration(newArmorPenetration: number);
    set angle(newAngle: number);
}

interface ITurret {
    get angle(): number;
    clockwiseMovement(): void;
    counterclockwiseMovement(): void;

    get bulletCapacity(): number;
}

interface IWeapon {
    get reloadSpeed(): number;

    get damageCoeff(): number;
    get armorPenetrationCoeff(): number;
    get moveSpeedCoeff(): number;
}

abstract class RectangularEntity implements IEntity {
    protected readonly _points: Point[];
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        const angleRad = angle * CONVERSION_TO_RADIANS;

        const widthCos = width * Math.cos(angleRad);
        const widthSin = width * Math.sin(angleRad);
        const heightCos = height * Math.cos(angleRad);
        const heightSin = height * Math.sin(angleRad);

        const firstPoint = new Point(x0, y0);
        const secondPoint = new Point(x0 + widthCos, y0 + widthSin);
        const thirdPoint = new Point(x0 + heightSin, y0 + heightCos);
        const fourthPoint = new Point(thirdPoint.x + widthCos, thirdPoint.y + widthSin);

        this._points = [firstPoint, secondPoint, thirdPoint, fourthPoint];
    }
    get points(): Point[] { return this._points }
    public calcAngleRad() {
        return Math.atan2(this.points[0].y - this.points[1].y,
            this.points[0].x - this.points[1].x);
    }
}

abstract class HullEntity extends RectangularEntity {
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        super(x0, y0, width, height, angle);
    }
    protected abstract _health: number;
    protected abstract _armor: number;
    protected abstract _armorStrength: number; // 0 to 1
    public takeDamage(bullet: IBullet) {
        this._armorStrength -= bullet.armorPenetration;
        this._health -= (bullet.damage - this._armor * this._armorStrength);
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

class Tank {
    private _track: ITrack;
    private _turret: ITurret;
    private _weapon: IWeapon;
    private _hullEntity: HullEntity;
    public constructor(track: ITrack, turret: ITurret, weapon: IWeapon, hullEntity: HullEntity) {
        this._track = track;
        this._turret = turret;
        this._weapon = weapon;
        this._hullEntity = hullEntity;
        this._lastTimeShot = Date.now();
    }

    private _deltaX: number;
    private _deltaY: number;
    private _bullets: IBullet[] = [];
    private _lastTimeShot: number;

    public shot(): IBullet {
        const dateNow = Date.now();
        if (this._bullets.length === 0 || dateNow - this._lastTimeShot < this._weapon.reloadSpeed)
            return null;

        const bullet = this._bullets.shift();
        bullet.damage *= this._weapon.damageCoeff;
        bullet.moveSpeed *= this._weapon.moveSpeedCoeff;
        bullet.armorPenetration *= this._weapon.armorPenetrationCoeff;
        bullet.angle = this._turret.angle;
        this._lastTimeShot = dateNow;

        return bullet;
    }
    public tryTakeBullet(bullet: IBullet): boolean {
        if (this._bullets.length === this._turret.bulletCapacity)
            return false;
        this._bullets.push(bullet);
        return true;
    }
    public clockwiseMovement() {
        this.rotatePoints(this._track.angleSpeed * CONVERSION_TO_RADIANS);
        this.calcDeltaCoordinates();
    }
    public counterclockwiseMovement() {
        this.rotatePoints(-this._track.angleSpeed * CONVERSION_TO_RADIANS);
        this.calcDeltaCoordinates();
    }
    public moveForward() {
        for (const point of this._hullEntity.points) {
            point.x += this._deltaX;
            point.y += this._deltaY;
        }
    }
    public moveBackward() {
        for (const point of this._hullEntity.points) {
            point.x -= this._deltaX;
            point.y -= this._deltaY;
        }
    }

    private rotatePoints(angleRad: number) {
        const centerX = (this._hullEntity.points[0].x + this._hullEntity.points[1].x) >> 1;
        const centerY = (this._hullEntity.points[0].y + this._hullEntity.points[1].y) >> 1;

        for (const point of this._hullEntity.points) {
            const deltaX = point.x - centerX;
            const deltaY = point.y - centerY;
            const rotatedX = deltaX * Math.cos(angleRad) - deltaY * Math.sin(angleRad);
            const rotatedY = deltaX * Math.sin(angleRad) + deltaY * Math.cos(angleRad);
            point.x = rotatedX + centerX;
            point.y = rotatedY + centerY;
        }
    }
    private calcDeltaCoordinates() {
        const angleRad = this._hullEntity.calcAngleRad();
        this._deltaX = this._track.moveSpeed * Math.cos(angleRad);
        this._deltaY = this._track.moveSpeed * Math.sin(angleRad);
    }
}

class Wall extends RectangularEntity {
    public constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        super(x0, y0, width, height, angle);
    }
}

class Field {
    private readonly _entities: IEntity[][][];
    private readonly _canvas: any;
    private readonly _width: number;
    private readonly _height: number;
    public get canvas(): any { return this._canvas }
    public get width(): number { return this._width }
    public get height(): number { return this._height }
    constructor(canvas: any, width: number, height: number) {
        this._canvas = canvas;
        this._width = width;
        this._height = height;
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
class DecorCreator {
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
    private addBackgroundTile(x: number, y: number, name: string)
    {
        const tile = document.createElement('img');
        tile.src = `src/img/backgrounds/${name}Background_${getRandomInt(0, 1)}.png`;
        tile.style.position = 'absolute';
        tile.style.left = `${x}px`;
        tile.style.bottom = `${y}px`;
        tile.style.width = `${CHUNK_SIZE}px`;
        tile.style.height = `${CHUNK_SIZE}px`;
        this._field.canvas.appendChild(tile);

        // ДЛЯ ТЕСТОВ
        tile.style.border = '1px solid black';
    }
}
class ObstacleCreator {
    private _field: Field;
    private static readonly MIN_INDENT: number = 10;
    private static readonly RECT_WALL_WIDTH: number = 101;
    private static readonly RECT_WALL_HEIGHT: number = 50;
    private static readonly SQUARE_WALL_SIZE: number = ObstacleCreator.RECT_WALL_HEIGHT;
    public constructor(field: Field) {
        this._field = field;
    }
    public createObstacles(name: string) {
        const xIndent = ObstacleCreator.calculateIndent(this._field.width);
        const yIndent = ObstacleCreator.calculateIndent(this._field.height -
            (ObstacleCreator.RECT_WALL_HEIGHT << 1));

        this.createHorObstacles(name, xIndent, yIndent);
        this.createVertObstacles(name, xIndent, yIndent);
    }
    private static calculateIndent(totalLength: number): number {
        const currLength = totalLength - (ObstacleCreator.MIN_INDENT << 1);
        const indent = currLength - ObstacleCreator.RECT_WALL_WIDTH *
            Math.floor(currLength / ObstacleCreator.RECT_WALL_WIDTH);
        return (indent >> 1) + ObstacleCreator.MIN_INDENT;
    }
    private createHorObstacles(name: string, xIndent: number, yIndent: number) {
        for (let x = xIndent;
             x <= this._field.width - xIndent - ObstacleCreator.RECT_WALL_WIDTH; x += ObstacleCreator.RECT_WALL_WIDTH) {
            this.createRectHorObstacle(x, yIndent, name);
            this.createRectHorObstacle(x, this._field.height - ObstacleCreator.RECT_WALL_HEIGHT - yIndent, name);
        }
    }
    private createVertObstacles(name: string, xIndent: number, yIndent: number) {
        for (let y = yIndent + ObstacleCreator.RECT_WALL_HEIGHT + (ObstacleCreator.RECT_WALL_HEIGHT >> 1);
             y <= this._field.height - yIndent - ObstacleCreator.RECT_WALL_WIDTH;
             y += ObstacleCreator.RECT_WALL_WIDTH) {
            this.createRectVertObstacle(xIndent - (ObstacleCreator.RECT_WALL_HEIGHT >> 1), y, name);
            this.createRectVertObstacle(this._field.width - xIndent - ObstacleCreator.RECT_WALL_WIDTH +
                (ObstacleCreator.RECT_WALL_HEIGHT >> 1),
                y, name);
        }
    }
    private createRectHorObstacle(x: number, y: number, name: string) {
        const obstacle = document.createElement('img');
        obstacle.src = `src/img/blocks/${name}Rectangle.png`;
        obstacle.style.position = 'absolute';
        obstacle.style.left = `${x}px`;
        obstacle.style.bottom = `${y}px`;
        obstacle.style.width = `${ObstacleCreator.RECT_WALL_WIDTH}px`;
        obstacle.style.height = `${ObstacleCreator.RECT_WALL_HEIGHT}px`;
        this._field.addObject(new Wall(x, y, ObstacleCreator.RECT_WALL_WIDTH,
            ObstacleCreator.RECT_WALL_HEIGHT, 0));

        this._field.canvas.appendChild(obstacle);
    }
    private createRectVertObstacle(x: number, y: number, name: string) {
        const angle: number = 90;
        const obstacle = document.createElement('img');
        obstacle.src = `src/img/blocks/${name}Rectangle.png`;
        obstacle.style.position = 'absolute';
        obstacle.style.left = `${x}px`;
        obstacle.style.bottom = `${y}px`;
        obstacle.style.width = `${ObstacleCreator.RECT_WALL_WIDTH}px`;
        obstacle.style.height = `${ObstacleCreator.RECT_WALL_HEIGHT}px`;
        obstacle.style.transform = `rotate(${angle}deg)`;
        this._field.addObject(new Wall(x + (ObstacleCreator.RECT_WALL_WIDTH >> 1) -
            (ObstacleCreator.RECT_WALL_HEIGHT >> 1),
            y - (ObstacleCreator.RECT_WALL_WIDTH >> 1) + (ObstacleCreator.RECT_WALL_HEIGHT >> 1),
            ObstacleCreator.RECT_WALL_WIDTH, ObstacleCreator.RECT_WALL_HEIGHT, angle));

        this._field.canvas.appendChild(obstacle);
    }
    private createSquareObstacle(x: number, y: number, name: string) {
        const obstacle = document.createElement('img');
        obstacle.src = `src/img/blocks/${name}Square.png`;
        obstacle.style.position = 'absolute';
        obstacle.style.left = `${x}px`;
        obstacle.style.bottom = `${y}px`;
        obstacle.style.width = `${ObstacleCreator.RECT_WALL_WIDTH}px`;
        obstacle.style.height = `${ObstacleCreator.RECT_WALL_HEIGHT}px`;
        this._field.addObject(new Wall(x, y, ObstacleCreator.SQUARE_WALL_SIZE,
            ObstacleCreator.SQUARE_WALL_SIZE, 0));

        this._field.canvas.appendChild(obstacle);
    }
}

// Additional function
function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
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

