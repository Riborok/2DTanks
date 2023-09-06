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