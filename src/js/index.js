"use strict";
const VK_W = 87;
const VK_S = 83;
const VK_A = 65;
const VK_D = 68;
const CONVERSION_TO_RADIANS = Math.PI / 180;
const CHUNK_SIZE = 115;
const MATERIAL = ['Grass', 'Ground', 'Sandstone'];
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
    rotatePoints(deltaAngleRad) {
        const centerX = (this.points[0].x + this.points[1].x) >> 1;
        const centerY = (this.points[0].y + this.points[1].y) >> 1;
        for (const point of this.points) {
            const deltaX = point.x - centerX;
            const deltaY = point.y - centerY;
            const rotatedX = deltaX * Math.cos(deltaAngleRad) - deltaY * Math.sin(deltaAngleRad);
            const rotatedY = deltaX * Math.sin(deltaAngleRad) + deltaY * Math.cos(deltaAngleRad);
            point.x = rotatedX + centerX;
            point.y = rotatedY + centerY;
        }
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
class BulletEntity extends RectangularEntity {
    get moveSpeed() { return this._moveSpeed; }
    ;
    get damage() { return this._damage; }
    ;
    get armorPenetration() { return this._armorPenetration; }
    ;
    constructor(x0, y0, width, height, angle) {
        super(x0, y0, width, height, angle);
    }
    launchFromWeapon(weapon) {
        this._moveSpeed *= weapon.moveSpeedCoeff;
        this._damage *= weapon.damageCoeff;
        this._armorPenetration *= weapon.armorPenetrationCoeff;
    }
}
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class LightBullet extends BulletEntity {
    constructor(x0, y0, angle) {
        super(x0, y0, LightBullet.width, LightBullet.height, angle);
        this._armorPenetration = 5;
        this._damage = 15;
        this._moveSpeed = 50;
    }
}
LightBullet.width = 20;
LightBullet.height = 45;
class LightBulletManufacturing {
    create(x0, y0, angle) {
        return new LightBullet(x0, y0, angle);
    }
}
class Tank {
    constructor(track, turret, weapon, hullEntity) {
        this._track = track;
        this._turret = turret;
        this._weapon = weapon;
        this._hullEntity = hullEntity;
        this._lastTimeShot = Date.now();
        this._bulletManufacturing = new LightBulletManufacturing();
    }
    shot() {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._weapon.reloadSpeed)
            return null;
        let bulletEntity = this._bulletManufacturing.create(this._weapon.xShot, this._weapon.yShot, this._turret.angle);
        bulletEntity.launchFromWeapon(this._weapon);
        this._lastTimeShot = dateNow;
        return bulletEntity;
    }
    incBulletQuantity(quantity) {
        this._bulletQuantity = Math.min(this._bulletQuantity + quantity, this._turret.bulletCapacity);
    }
    takeNewBulletManufacturing(bulletManufacturing) {
        this._bulletManufacturing = bulletManufacturing;
    }
    clockwiseMovement() {
        this._hullEntity.rotatePoints(this._track.angleSpeed * CONVERSION_TO_RADIANS);
        this.calcDeltaCoordinates();
    }
    counterclockwiseMovement() {
        this._hullEntity.rotatePoints(-this._track.angleSpeed * CONVERSION_TO_RADIANS);
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
class DecorCreator {
    constructor(field) {
        this._field = field;
    }
    fullFillBackground(name) {
        for (let i = 0; i < this._field.width; i += CHUNK_SIZE)
            for (let j = 0; j < this._field.height; j += CHUNK_SIZE)
                this.addBackgroundTile(i, j, name);
    }
    addBackgroundTile(x, y, name) {
        const tile = document.createElement('img');
        tile.src = `src/img/backgrounds/${name}Background_${getRandomInt(0, 1)}.png`;
        tile.style.position = 'absolute';
        tile.style.left = `${x}px`;
        tile.style.bottom = `${y}px`;
        tile.style.width = `${CHUNK_SIZE}px`;
        tile.style.height = `${CHUNK_SIZE}px`;
        this._field.canvas.appendChild(tile);
        tile.style.border = '1px solid black';
    }
}
class ObstacleCreator {
    constructor(field) {
        this._field = field;
    }
    createObstacles(name) {
        const xIndent = ObstacleCreator.calculateIndent(this._field.width);
        const yIndent = ObstacleCreator.calculateIndent(this._field.height -
            (ObstacleCreator.RECT_WALL_HEIGHT << 1));
        this.createHorObstacles(name, xIndent, yIndent);
        this.createVertObstacles(name, xIndent, yIndent);
    }
    static calculateIndent(totalLength) {
        const currLength = totalLength - (ObstacleCreator.MIN_INDENT << 1);
        const indent = currLength - ObstacleCreator.RECT_WALL_WIDTH *
            Math.floor(currLength / ObstacleCreator.RECT_WALL_WIDTH);
        return (indent >> 1) + ObstacleCreator.MIN_INDENT;
    }
    createHorObstacles(name, xIndent, yIndent) {
        for (let x = xIndent; x <= this._field.width - xIndent - ObstacleCreator.RECT_WALL_WIDTH; x += ObstacleCreator.RECT_WALL_WIDTH) {
            this.createRectHorObstacle(x, yIndent, name);
            this.createRectHorObstacle(x, this._field.height - ObstacleCreator.RECT_WALL_HEIGHT - yIndent, name);
        }
    }
    createVertObstacles(name, xIndent, yIndent) {
        for (let y = yIndent + ObstacleCreator.RECT_WALL_HEIGHT + (ObstacleCreator.RECT_WALL_HEIGHT >> 1); y <= this._field.height - yIndent - ObstacleCreator.RECT_WALL_WIDTH; y += ObstacleCreator.RECT_WALL_WIDTH) {
            this.createRectVertObstacle(xIndent - (ObstacleCreator.RECT_WALL_HEIGHT >> 1), y, name);
            this.createRectVertObstacle(this._field.width - xIndent - ObstacleCreator.RECT_WALL_WIDTH +
                (ObstacleCreator.RECT_WALL_HEIGHT >> 1), y, name);
        }
    }
    createRectHorObstacle(x, y, name) {
        const obstacle = document.createElement('img');
        obstacle.src = `src/img/blocks/${name}Rectangle.png`;
        obstacle.style.position = 'absolute';
        obstacle.style.left = `${x}px`;
        obstacle.style.bottom = `${y}px`;
        obstacle.style.width = `${ObstacleCreator.RECT_WALL_WIDTH}px`;
        obstacle.style.height = `${ObstacleCreator.RECT_WALL_HEIGHT}px`;
        this._field.addObject(new Wall(x, y, ObstacleCreator.RECT_WALL_WIDTH, ObstacleCreator.RECT_WALL_HEIGHT, 0));
        this._field.canvas.appendChild(obstacle);
    }
    createRectVertObstacle(x, y, name) {
        const angle = 90;
        const obstacle = document.createElement('img');
        obstacle.src = `src/img/blocks/${name}Rectangle.png`;
        obstacle.style.position = 'absolute';
        obstacle.style.left = `${x}px`;
        obstacle.style.bottom = `${y}px`;
        obstacle.style.width = `${ObstacleCreator.RECT_WALL_WIDTH}px`;
        obstacle.style.height = `${ObstacleCreator.RECT_WALL_HEIGHT}px`;
        obstacle.style.transform = `rotate(${angle}deg)`;
        this._field.addObject(new Wall(x + (ObstacleCreator.RECT_WALL_WIDTH >> 1) -
            (ObstacleCreator.RECT_WALL_HEIGHT >> 1), y - (ObstacleCreator.RECT_WALL_WIDTH >> 1) + (ObstacleCreator.RECT_WALL_HEIGHT >> 1), ObstacleCreator.RECT_WALL_WIDTH, ObstacleCreator.RECT_WALL_HEIGHT, angle));
        this._field.canvas.appendChild(obstacle);
    }
    createSquareObstacle(x, y, name) {
        const obstacle = document.createElement('img');
        obstacle.src = `src/img/blocks/${name}Square.png`;
        obstacle.style.position = 'absolute';
        obstacle.style.left = `${x}px`;
        obstacle.style.bottom = `${y}px`;
        obstacle.style.width = `${ObstacleCreator.RECT_WALL_WIDTH}px`;
        obstacle.style.height = `${ObstacleCreator.RECT_WALL_HEIGHT}px`;
        this._field.addObject(new Wall(x, y, ObstacleCreator.SQUARE_WALL_SIZE, ObstacleCreator.SQUARE_WALL_SIZE, 0));
        this._field.canvas.appendChild(obstacle);
    }
}
ObstacleCreator.MIN_INDENT = 10;
ObstacleCreator.RECT_WALL_WIDTH = 101;
ObstacleCreator.RECT_WALL_HEIGHT = 50;
ObstacleCreator.SQUARE_WALL_SIZE = ObstacleCreator.RECT_WALL_HEIGHT;
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}
