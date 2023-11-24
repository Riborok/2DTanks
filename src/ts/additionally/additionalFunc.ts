import {ANGLE_EPSILON} from "../constants/gameConstants";

/**
 * Generates a random integer between the specified minimum and maximum values, inclusive.
 * @param min The minimum value of the range.
 * @param max The maximum value of the range.
 * @returns A random integer within the specified range.
 */
export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

/**
 * Generic binary search with a comparator.
 * @param arr Sorted array of elements.
 * @param target Target element to search for.
 * @param comparator Function to compare two elements.
 * @returns Index of the found element, or -1 if the element is not found.
 */
export function binarySearch<T>(arr: T[], target: T, comparator: (a: T, b: T) => number): number {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        const mid = (left + right) >> 1;
        const compareResult = comparator(arr[mid], target);

        if (compareResult > 0)
            right = mid - 1;
        else if (compareResult < 0)
            left = mid + 1;
        else
            return mid;
    }
    return -1;
}

/**
 * Remaps a value from one numeric range to another using linear interpolation.
 * @param value The original value to be remapped.
 * @param currentRangeMin The minimum value of the current range.
 * @param currentRangeMax The maximum value of the current range.
 * @param targetRangeMin The minimum value of the target range.
 * @param targetRangeMax The maximum value of the target range.
 * @returns The remapped value within the target range.
 */
export function remapValueToRange(value: number, currentRangeMin: number, currentRangeMax: number, targetRangeMin: number,
                           targetRangeMax: number): number {
    return (value - currentRangeMin) / (currentRangeMax - currentRangeMin) * (targetRangeMax - targetRangeMin) + targetRangeMin;
}

/**
 * Rounds a number to a specified number of decimal places.
 * @param number The number to be rounded.
 * @param rounding The number of decimal places to round to.
 * @returns The rounded number.
 */
export function roundNumber(number: number, rounding: number): number {
    return Math.round(number * rounding) / rounding;
}

/**
 * Checks if there is at least one element in an Iterable.
 * @param iterable The Iterable to check for elements.
 * @returns True if at least one element is found, otherwise false.
 */
export function hasElements(iterable: Iterable<any>): boolean {
    for (const iterableElement of iterable)
        return true;
    return false;
}

/**
 * Gets the first element from an Iterable.
 * @param iterable The Iterable to retrieve the first element from.
 * @returns The first element of the Iterable, or null if the Iterable is empty.
 */
export function getFirstElement<T>(iterable: Iterable<T>): T | null {
    for (const iterableElement of iterable)
        return iterableElement;
    return null;
}

/**
 * Clears all child elements from the document body.
 */
export function clearDOM() {
    const rootElement = document.body;
    while (rootElement.firstChild)
        rootElement.removeChild(rootElement.firstChild);
}

/**
 * Checks if two angles are approximately orthogonal in radians.
 * @param {number} angle1 - The first angle in radians. Should be normalized to the range [-π, π].
 * @param {number} angle2 - The second angle in radians. Should be normalized to the range [-π, π].
 * @returns {boolean} True if the angles are approximately orthogonal, otherwise false.
 */
export function areOrthogonal(angle1: number, angle2: number): boolean {
    const diff = Math.abs(angle1 - angle2);
    return Math.abs(diff - Math.PI / 2) < ANGLE_EPSILON || Math.abs(diff - 1.5 * Math.PI) < ANGLE_EPSILON;
}

/**
 * Checks if two vectors are approximately collinear given their angles in radians.
 * @param {number} angle1 - The angle of the first vector in radians. Should be normalized to the range [-π, π].
 * @param {number} angle2 - The angle of the second vector in radians. Should be normalized to the range [-π, π].
 * @returns {boolean} True if the vectors are approximately collinear, otherwise false.
 */
export function areCollinear(angle1: number, angle2: number): boolean {
    const diff = Math.abs(angle1 - angle2);
    return diff < ANGLE_EPSILON || Math.abs(diff - Math.PI) < ANGLE_EPSILON || Math.abs(diff - 2 * Math.PI) < ANGLE_EPSILON;
}

/**
 * Checks if two vectors are approximately orthogonal or collinear given their angles in radians.
 * @param {number} angle1 - The angle of the first vector in radians. Should be normalized to the range [-π, π].
 * @param {number} angle2 - The angle of the second vector in radians. Should be normalized to the range [-π, π].
 * @returns {boolean} True if the vectors are approximately orthogonal or collinear, otherwise false.
 */
export function areOrthogonalOrCollinear(angle1: number, angle2: number): boolean {
    return areOrthogonal(angle1, angle2) || areCollinear(angle1, angle2);
}