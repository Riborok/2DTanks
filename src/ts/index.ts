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
    get movementSpeed(): number;
    get angleSpeed(): number;
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
    get movementSpeedCoeff(): number;

    get barrelLength(): number;
}
abstract class Sprite {
    protected _sprite : any;
    protected _x : number;
    protected _y : number;
    protected _angle : number;

    protected _deltaX: number;
    protected _deltaY: number;
    protected _isDeltaChanged: boolean;

    protected constructor(x: number, y: number, angle: number) {
        this._sprite = document.createElement('img');
        this._sprite.style.position = 'absolute';
        this._sprite.style.left = `${x}px`;
        this._sprite.style.bottom = `${y}px`;
        this._sprite.style.transform = `rotate(${angle}deg)`;

        this._x = x;
        this._y = y;
        this._angle = angle;

        this._isDeltaChanged = true;
    }

    public moveForward(movementSpeed: number) {
        if (this._isDeltaChanged) {
            this._isDeltaChanged = false;
            this.calcDeltaCoordinates(movementSpeed);
        }

        this._x += this._deltaX;
        this._y += this._deltaY;

        this.updatePosition();
    }

    public moveBackward(movementSpeed: number) {
        if (this._isDeltaChanged) {
            this._isDeltaChanged = false;
            this.calcDeltaCoordinates(movementSpeed);
        }

        this._x -= this._deltaX;
        this._y -= this._deltaY;

        this.updatePosition();
    }
    public clockwiseMovement(angleSpeed: number) {
        this._isDeltaChanged = true;
        this._angle += angleSpeed;
        this.updateAngle();
    }
    public counterclockwiseMovement(angleSpeed: number){
        this._isDeltaChanged = true;
        this._angle -= angleSpeed;
        this.updateAngle();
    }

    private updatePosition() {
        this._sprite.style.left = `${this._x}px`;
        this._sprite.style.top = `${this._y}px`;
    }
    private updateAngle() {
        this._sprite.style.transform = `rotate(${this._angle}deg)`;
    }
    private calcDeltaCoordinates(movementSpeed: number) {
        const angleRad = this._angle * CONVERSION_TO_RADIANS;
        this._deltaX = movementSpeed * Math.cos(angleRad);
        this._deltaY = movementSpeed * Math.sin(angleRad);
    }
}

abstract class RectangularEntity implements IEntity {
    protected readonly _points: Point[];
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        this._points = [new Point(x0, y0),
            new Point(x0 + width, y0),
            new Point(x0, y0 + height),
            new Point(x0 + width, y0 + height)];
        if (angle != 0)
            this.rotatePoints(- angle * CONVERSION_TO_RADIANS);
    }
    get points(): Point[] { return this._points }
    public calcAngleRad() {
        return Math.atan2(this.points[0].y - this.points[3].y,
            this.points[0].x - this.points[3].x);
    }
    public rotatePoints(deltaAngleRad: number) {
        const centerX = (this.points[0].x + this.points[3].x) >> 1;
        const centerY = (this.points[0].y + this.points[3].y) >> 1;

        for (const point of this.points) {
            const deltaX = point.x - centerX;
            const deltaY = point.y - centerY;
            const rotatedX = deltaX * Math.cos(deltaAngleRad) - deltaY * Math.sin(deltaAngleRad);
            const rotatedY = deltaX * Math.sin(deltaAngleRad) + deltaY * Math.cos(deltaAngleRad);
            point.x = Math.round(rotatedX + centerX);
            point.y = Math.round(rotatedY + centerY);
        }
    }
}

abstract class HullEntity extends RectangularEntity {
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        super(x0, y0, width, height, angle);
    }
    protected abstract _health: number;
    protected abstract _armor: number;
    protected abstract _armorStrength: number; // 0 to 1
    public takeDamage(bullet: BulletEntity) {
        this._armorStrength -= bullet.armorPenetration;
        this._health -= (bullet.damage - this._armor * this._armorStrength);
    }
}

abstract class BulletEntity extends RectangularEntity{
    public get movementSpeed(): number { return this._movementSpeed};
    public get damage(): number { return this._damage};
    public get armorPenetration(): number { return this._armorPenetration};

    protected abstract _movementSpeed: number;
    protected abstract _damage: number;
    protected abstract _armorPenetration: number;
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        super(x0, y0, width, height, angle);
    }
    public launchFromWeapon(weapon: IWeapon) {
        this._movementSpeed *= weapon.movementSpeedCoeff;
        this._damage *= weapon.damageCoeff;
        this._armorPenetration *= weapon.armorPenetrationCoeff;
    }
}
interface IBulletManufacturing {
    create(x0: number, y0: number, angle: number): BulletEntity;
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

class TrackSprite extends Sprite {
    private static readonly WIDTH: number = 98;
    private static readonly HEIGHT: number = 17;
    private readonly _srcState0: string;
    private readonly _srcState1: string;
    public constructor(x0: number, y0: number, angle: number, num: number) {
        super(x0, y0, angle);

        this._srcState0 = `src/img/tanks/Tracks/Track${num}_A.png`;
        this._srcState1 = `src/img/tanks/Tracks/Track_${num}_B.png`;
        this._sprite.style.src = this._srcState0;
        this._sprite.style.width = `${TrackSprite.WIDTH}px`;
        this._sprite.style.height = `${TrackSprite.HEIGHT}px`;
    }
    public moveForward(movementSpeed: number) {
        super.moveForward(movementSpeed);
        if (this._sprite.style.src === this._srcState0)
            this._sprite.style.src = this._srcState1;
        else
            this._sprite.style.src = this._srcState0;
    }
    public moveBackward(movementSpeed: number) {
        super.moveBackward(movementSpeed);
        if (this._sprite.style.src === this._srcState0)
            this._sprite.style.src = this._srcState1;
        else
            this._sprite.style.src = this._srcState0;
    }
}

class HullSprite extends Sprite {
    private static readonly WIDTH: number = 98;
    private static readonly HEIGHT: number = 17;
    public constructor(x0: number, y0: number, angle: number, color: string, num: number,
                       width: number, height: number) {
        super(x0, y0, angle);

        this._sprite.style.src = `src/img/tanks/Hulls/Hull_${num}/Hull_${color}.png`;
        this._sprite.style.width = `${width}px`;
        this._sprite.style.height = `${height}px`;
    }
}

class LightBullet extends BulletEntity {
    public static readonly WIDTH: number = 20;
    public static readonly HEIGHT: number = 45;

    protected _armorPenetration: number = 5;
    protected _damage: number = 15;
    protected _movementSpeed: number = 50;
    public constructor(x0: number, y0: number, angle: number) {
        super(x0, y0, LightBullet.WIDTH, LightBullet.HEIGHT, angle);
    }
}
class LightBulletManufacturing implements IBulletManufacturing{
    public create(x0: number, y0: number, angle: number): BulletEntity {
        return new LightBullet(x0, y0, angle);
    }
}

class Tank {
    private _track: ITrack;
    private _turret: ITurret;
    private _weapon: IWeapon;
    private _hullEntity: HullEntity;

    private _isDeltaChanged: boolean;
    private _deltaX: number;
    private _deltaY: number;
    private _bulletQuantity: number;
    private _lastTimeShot: number;
    private _bulletManufacturing: IBulletManufacturing;
    public constructor(track: ITrack, turret: ITurret, weapon: IWeapon, hullEntity: HullEntity) {
        this._track = track;
        this._turret = turret;
        this._weapon = weapon;
        this._hullEntity = hullEntity;

        this._bulletQuantity = 0;
        this._isDeltaChanged = false;
        this.calcDeltaCoordinates();
        this._lastTimeShot = Date.now();

        this._bulletManufacturing = new LightBulletManufacturing();
    }

    public shot(): BulletEntity {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._weapon.reloadSpeed)
            return null;

        const angleRad = this._turret.angle * CONVERSION_TO_RADIANS;
        const xStart = ((this._hullEntity.points[0].x + this._hullEntity.points[3].x) >> 1) +
            this._weapon.barrelLength * Math.cos(angleRad);
        const yStart = ((this._hullEntity.points[0].y + this._hullEntity.points[3].y) >> 1) +
            this._weapon.barrelLength * Math.sin(angleRad);

        const bulletEntity = this._bulletManufacturing.create(xStart, yStart, this._turret.angle);
        bulletEntity.launchFromWeapon(this._weapon);
        this._lastTimeShot = dateNow;
        this._bulletQuantity--;

        return bulletEntity;
    }
    public incBulletQuantity(quantity: number) {
        this._bulletQuantity = Math.min(this._bulletQuantity + quantity, this._turret.bulletCapacity);
    }
    public takeNewBulletManufacturing(bulletManufacturing: IBulletManufacturing) {
        this._bulletManufacturing = bulletManufacturing;
    }
    public clockwiseMovement() {
        this._isDeltaChanged = true;
        this._hullEntity.rotatePoints(this._track.angleSpeed * CONVERSION_TO_RADIANS);
    }
    public counterclockwiseMovement() {
        this._isDeltaChanged = true;
        this._hullEntity.rotatePoints(- this._track.angleSpeed * CONVERSION_TO_RADIANS);
    }
    public moveForward() {
        if (this._isDeltaChanged) {
            this._isDeltaChanged = false;
            this.calcDeltaCoordinates();
        }

        for (const point of this._hullEntity.points) {
            point.x += this._deltaX;
            point.y += this._deltaY;
        }
    }
    public moveBackward() {
        if (this._isDeltaChanged) {
            this._isDeltaChanged = false;
            this.calcDeltaCoordinates();
        }

        for (const point of this._hullEntity.points) {
            point.x -= this._deltaX;
            point.y -= this._deltaY;
        }
    }
    private calcDeltaCoordinates() {
        const angleRad = this._hullEntity.calcAngleRad();
        this._deltaX = this._track.movementSpeed * Math.cos(angleRad);
        this._deltaY = this._track.movementSpeed * Math.sin(angleRad);
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
            for (let j: number = this._field.height; j > -CHUNK_SIZE; j -= CHUNK_SIZE)
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
        this._field.addObject(new Wall(x, y, ObstacleCreator.RECT_WALL_WIDTH,
            ObstacleCreator.RECT_WALL_HEIGHT, angle));

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

