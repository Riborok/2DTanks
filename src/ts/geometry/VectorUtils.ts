import {Point, Vector} from "./Point";

export class VectorUtils {
    private constructor() { }
    public static dotProduct(vector1: Point, vector2: Point): number {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }
    public static crossProduct(vector1: Point, vector2: Point): number {
        return vector1.x * vector2.y - vector1.y * vector2.x;
    }
    public static add(vector1: Point, vector2: Point): Vector {
        return new Vector(vector1.x + vector2.x, vector1.y + vector2.y);
    }
    public static subtract(minuendVector: Point, subtrahendVector: Point): Vector {
        return new Vector(minuendVector.x - subtrahendVector.x, minuendVector.y - subtrahendVector.y);
    }
    public static scale(vector: Point, scalar: number): Vector {
        return new Vector(vector.x * scalar, vector.y * scalar);
    }
}