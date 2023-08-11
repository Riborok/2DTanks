"use strict";
const VK_W = 87;
const VK_S = 83;
const VK_A = 65;
const VK_D = 68;
const CONVERSION_TO_RADIANS = Math.PI / 180;
const CHUNK_SIZE = 115;
const INDENT = 10;
const RECT_WALL_WIDTH = 101;
const RECT_WALL_HEIGHT = 50;
const SQUARE_WALL_SIZE = RECT_WALL_HEIGHT;
class RectangularEntity {
    constructor(x0, y0, width, height, angle) {
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
    get points() { return this._points; }
    calcAngleRad() {
        return Math.atan2(this.points[0].y - this.points[1].y, this.points[0].x - this.points[1].x);
    }
}
class HullEntity extends RectangularEntity {
    constructor(x0, y0, width, height, angle) {
        super(x0, y0, width, height, angle);
    }
    takeDamage(bullet) {
        this._armorStrength -= bullet.armorPenetration;
        this._health -= (bullet.damage - this._armor * this._armorStrength);
    }
}
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Tank {
    constructor(track, turret, weapon, hullEntity) {
        this._bullets = [];
        this._track = track;
        this._turret = turret;
        this._weapon = weapon;
        this._hullEntity = hullEntity;
        this._lastTimeShot = Date.now();
    }
    shot() {
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
    tryTakeBullet(bullet) {
        if (this._bullets.length === this._turret.bulletCapacity)
            return false;
        this._bullets.push(bullet);
        return true;
    }
    clockwiseMovement() {
        this.rotatePoints(this._track.angleSpeed * CONVERSION_TO_RADIANS);
        this.calcDeltaCoordinates();
    }
    counterclockwiseMovement() {
        this.rotatePoints(-this._track.angleSpeed * CONVERSION_TO_RADIANS);
        this.calcDeltaCoordinates();
    }
    moveForward() {
        for (const point of this._hullEntity.points) {
            point.x += this._deltaX;
            point.y += this._deltaY;
        }
    }
    moveBackward() {
        for (const point of this._hullEntity.points) {
            point.x -= this._deltaX;
            point.y -= this._deltaY;
        }
    }
    rotatePoints(angleRad) {
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
    calcDeltaCoordinates() {
        const angleRad = this._hullEntity.calcAngleRad();
        this._deltaX = this._track.moveSpeed * Math.cos(angleRad);
        this._deltaY = this._track.moveSpeed * Math.sin(angleRad);
    }
}
class Wall extends RectangularEntity {
    constructor(x0, y0, width, height, angle) {
        super(x0, y0, width, height, angle);
    }
}
class Field {
    get canvas() { return this._canvas; }
    get width() { return this._width; }
    get height() { return this._height; }
    constructor(canvas, width, height) {
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
    addObject(entity) {
        for (const point of entity.points) {
            const chunkX = Math.floor(point.x / CHUNK_SIZE);
            const chunkY = Math.floor(point.y / CHUNK_SIZE);
            if (this._entities[chunkX][chunkY][this._entities[chunkX][chunkY].length - 1] !== entity) {
                this._entities[chunkX][chunkY].push(entity);
            }
        }
    }
}
function fullFillBackGround(name, field) {
    field.canvas.style.overflow = 'hidden';
    for (let i = 0; i < field.width; i += CHUNK_SIZE)
        for (let j = 0; j < field.height; j += CHUNK_SIZE)
            addBackgroundTile(i, j, name, field);
}
function addBackgroundTile(x, y, name, field) {
    const tile = document.createElement('img');
    tile.src = `./img/backgrounds/${name}Background.png`;
    tile.style.position = 'absolute';
    tile.style.left = `${x}px`;
    tile.style.bottom = `${y}px`;
    tile.style.width = `${CHUNK_SIZE}px`;
    tile.style.height = `${CHUNK_SIZE}px`;
    field.canvas.appendChild(tile);
    tile.style.border = '1px solid black';
}
function createObstacles(name, field) {
    const widthForWalls = field.width - (INDENT << 1);
    const additionalIndent = widthForWalls - RECT_WALL_WIDTH * Math.floor(widthForWalls / RECT_WALL_WIDTH);
    for (let x = INDENT + (additionalIndent >> 1); x < field.width - INDENT - RECT_WALL_HEIGHT; x += RECT_WALL_WIDTH) {
        createRectObstacleHor(x, INDENT, name, field);
        createRectObstacleHor(x, field.height - RECT_WALL_HEIGHT - INDENT, name, field);
    }
    for (let y = INDENT + RECT_WALL_HEIGHT + (RECT_WALL_HEIGHT >> 1); y < field.height - INDENT - RECT_WALL_HEIGHT; y += RECT_WALL_WIDTH) {
        createRectObstacleVert(INDENT - (RECT_WALL_HEIGHT >> 1), y, name, field);
        createRectObstacleVert(field.width - RECT_WALL_WIDTH - INDENT + (RECT_WALL_HEIGHT >> 1), y, name, field);
    }
}
function createSquareObstacle(x, y, name, field) {
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
function createRectObstacleHor(x, y, name, field) {
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
function createRectObstacleVert(x, y, name, field) {
    const angle = 90;
    const obstacle = document.createElement('img');
    obstacle.src = `./img/blocks/${name}Rectangle.png`;
    obstacle.style.position = 'absolute';
    obstacle.style.left = `${x}px`;
    obstacle.style.bottom = `${y}px`;
    obstacle.style.width = `${RECT_WALL_WIDTH}px`;
    obstacle.style.height = `${RECT_WALL_HEIGHT}px`;
    obstacle.style.transform = `rotate(${angle}deg)`;
    field.addObject(new Wall(x + (RECT_WALL_WIDTH >> 1) - (RECT_WALL_HEIGHT >> 1), y - (RECT_WALL_WIDTH >> 1) + (RECT_WALL_HEIGHT >> 1), RECT_WALL_WIDTH, RECT_WALL_HEIGHT, angle));
    field.canvas.appendChild(obstacle);
}
