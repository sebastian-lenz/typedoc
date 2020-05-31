/**
 * Inserts an item into an array sorted by order. If two items have the same order,
 * the item inserted later will be placed earlier in the array.
 * @param arr modified by inserting item.
 * @param item
 */
export function insertOrderSorted<T extends { order?: number }>(arr: T[], item: T): T[] {
    const index = binaryFindPartition(arr, v => (v.order ?? 0) >= (item.order ?? 0));
    arr.splice(index === -1 ? arr.length : index, 0, item);
    return arr;
}

/**
 * Performs a binary search of a given array, returning the index of the first item
 * for which `partition` returns true. Returns the -1 if there are no items in `arr`
 * such that `partition(item)` is true.
 * @param arr
 * @param partition should return true while less than the partition point.
 */
export function binaryFindPartition<T>(arr: readonly T[], partition: (item: T) => boolean): number {
    if (arr.length === 0) {
        return -1;
    }

    let low = 0, high = arr.length - 1;

    while (high > low) {
        let mid = low + Math.floor((high - low) / 2);
        if (partition(arr[mid])) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    return partition(arr[low]) ? low : -1;
}

/**
 * Removes an item from the array if the array exists and the item is included
 * within it.
 * @param arr
 * @param item
 */
export function removeIfPresent<T>(arr: T[] | undefined, item: T) {
    if (!arr) {
        return;
    }
    const index = arr.indexOf(item);
    if (index !== -1) {
        arr.splice(index, 1);
    }
}

/**
 * Simple flat map method, we can't use Array.prototype.flatMap until Node 11, which practically means until Node 10 leaves LTS.
 * This should be removed in April 2021 when we drop support for Node 10.
 * @param arr
 * @param fn
 */
export function flatMap<T, U>(arr: readonly T[], fn: (item: T, index: number, arr: readonly T[]) => U[]): U[] {
    const result: U[] = [];
    for (let index = 0; index < arr.length; index++) {
        result.push(...fn(arr[index], index, arr));
    }
    return result;
}
