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
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Rectangle {
    constructor(x0, y0, width, height, slope) {
        this.points = [];
        this.points = [
            new Point(x0, y0),
            new Point(x0 + width * Math.cos(slope * CONVERSION_TO_RADIANS), y0 + width * Math.sin(slope * CONVERSION_TO_RADIANS)),
            new Point(x0 + height * Math.cos(slope * CONVERSION_TO_RADIANS), y0 + height * Math.sin(slope * CONVERSION_TO_RADIANS)),
        ];
        this.points.push(new Point(this.points[2].x + width * Math.cos(slope * CONVERSION_TO_RADIANS), this.points[2].y + width * Math.sin(slope * CONVERSION_TO_RADIANS)));
    }
}
class Field {
    constructor(canvas, width, height) {
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
    let tile = document.createElement('img');
    tile.src = `./img/background/${name}Background.png`;
    tile.style.position = 'absolute';
    tile.style.left = `${x}px`;
    tile.style.bottom = `${y}px`;
    tile.style.width = `${CHUNK_SIZE}px`;
    tile.style.height = `${CHUNK_SIZE}px`;
    field.canvas.appendChild(tile);
    tile.style.border = '1px solid black';
}
function createObstacles(name, field) {
    for (let x = INDENT; x < field.width - INDENT - RECT_WALL_HEIGHT; x += RECT_WALL_WIDTH) {
        createRectObstacleHor(x, INDENT, name, field);
        createRectObstacleHor(x, field.height - RECT_WALL_HEIGHT - INDENT, name, field);
    }
    for (let y = INDENT + RECT_WALL_HEIGHT + (RECT_WALL_HEIGHT >> 1); y < field.height - INDENT - RECT_WALL_HEIGHT; y += RECT_WALL_WIDTH) {
        createRectObstacleVert(INDENT - (RECT_WALL_HEIGHT >> 1), y, name, field);
        createRectObstacleVert(field.width - RECT_WALL_WIDTH - INDENT + (RECT_WALL_HEIGHT >> 1), y, name, field);
    }
}
function createSquareObstacle(x, y, name, field) {
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
function createRectObstacleHor(x, y, name, field) {
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
function createRectObstacleVert(x, y, name, field) {
    const slope = 90;
    let obstacle = document.createElement('img');
    obstacle.src = `./img/blocks/${name}Rectangle.png`;
    obstacle.style.position = 'absolute';
    obstacle.style.left = `${x}px`;
    obstacle.style.bottom = `${y}px`;
    obstacle.style.width = `${RECT_WALL_WIDTH}px`;
    obstacle.style.height = `${RECT_WALL_HEIGHT}px`;
    obstacle.style.transform = `rotate(${slope}deg)`;
    field.addObject(new Rectangle(x + (RECT_WALL_WIDTH >> 1) + (RECT_WALL_HEIGHT >> 1), y - (RECT_WALL_WIDTH >> 1) + (RECT_WALL_HEIGHT >> 1), RECT_WALL_WIDTH, RECT_WALL_HEIGHT, slope));
    field.canvas.appendChild(obstacle);
}
