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
 * Checks if there is at least one element in an Iterable.
 * @param iterable The Iterable to check for elements.
 * @returns True if at least one element is found, otherwise false.
 */
export function hasElements(iterable: Iterable<any>): boolean {
    for (const iterableElement of iterable)
        return true;
    return false;
}
