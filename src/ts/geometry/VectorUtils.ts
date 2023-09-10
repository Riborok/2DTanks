import {Point, Vector} from "./Point";

/**
 * A utility class for performing common vector operations.
 */
export class VectorUtils {
    private constructor() { }
    /**
     * Computes the dot product of two vectors and returns the result.
     * @param vector1 The first vector.
     * @param vector2 The second vector.
     * @returns The dot product of the input vectors.
     */
    public static dotProduct(vector1: Point, vector2: Point): number {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }
    /**
     * Computes the cross product of two vectors and returns the result.
     * @param vector1 The first vector.
     * @param vector2 The second vector.
     * @returns The cross product of the input vectors.
     */
    public static crossProduct(vector1: Point, vector2: Point): number {
        return vector1.x * vector2.y - vector1.y * vector2.x;
    }
    /**
     * Adds two vectors together and returns the result as a new vector.
     * @param vector1 The first vector.
     * @param vector2 The second vector.
     * @returns A new vector representing the sum of the input vectors.
     */
    public static add(vector1: Point, vector2: Point): Vector {
        return new Vector(vector1.x + vector2.x, vector1.y + vector2.y);
    }
    /**
     * Subtracts one vector from another and returns the result as a new vector.
     * @param minuendVector The vector from which to subtract.
     * @param subtrahendVector The vector to subtract.
     * @returns A new vector representing the result of the subtraction.
     */
    public static subtract(minuendVector: Point, subtrahendVector: Point): Vector {
        return new Vector(minuendVector.x - subtrahendVector.x, minuendVector.y - subtrahendVector.y);
    }
    /**
     * Scales a vector by a scalar value and returns the result as a new vector.
     * @param vector The vector to scale.
     * @param scalar The scalar value by which to multiply the vector's components.
     * @returns A new vector representing the scaled vector.
     */
    public static scale(vector: Point, scalar: number): Vector {
        return new Vector(vector.x * scalar, vector.y * scalar);
    }
}