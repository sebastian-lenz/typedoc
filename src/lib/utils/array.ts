/**
 * Inserts an item into an array sorted by priority. If two items have the same priority,
 * the item will be inserted later will be placed earlier in the array.
 * [high ... low]
 * @param arr modified by inserting item.
 * @param item
 */
export function insertPrioritySorted<T extends { priority: number }>(
    arr: T[],
    item: T
): T[] {
    const index = binaryFindPartition(arr, (v) => v.priority <= item.priority);
    arr.splice(index === -1 ? arr.length : index, 0, item);
    return arr;
}

/**
 * Inserts an item into an array sorted by order. If two items have the same order,
 * the item will be inserted later will be placed earlier in the array.
 * [low ... high]
 * @param arr modified by inserting item.
 * @param item
 */
export function insertOrderSorted<T extends { order: number }>(
    arr: T[],
    item: T
): T[] {
    const index = binaryFindPartition(arr, (v) => v.order >= item.order);
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
export function binaryFindPartition<T>(
    arr: readonly T[],
    partition: (item: T) => boolean
): number {
    if (arr.length === 0) {
        return -1;
    }

    let low = 0,
        high = arr.length - 1;

    while (high > low) {
        const mid = low + Math.floor((high - low) / 2);
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
 * Remove items in an array which match a predicate.
 * @param arr
 * @param predicate
 */
export function removeIf<T>(arr: T[], predicate: (item: T) => boolean) {
    const indices = filterMap(arr, (item, index) =>
        predicate(item) ? index : void 0
    );
    for (const index of indices.reverse()) {
        arr.splice(index, 1);
    }
}

/**
 * Filters out duplicate values from the given iterable.
 * @param arr
 */
export function unique<T>(arr: Iterable<T> | undefined): T[] {
    return Array.from(new Set(arr));
}

/**
 * Filters out duplicate values from the given array with a custom equals check.
 * @param arr
 */
export function uniqueByEquals<T extends { equals(other: T): boolean }>(
    arr: readonly T[] | undefined
) {
    const result: T[] = [];

    for (const item of arr ?? []) {
        if (result.every((other) => !other.equals(item))) {
            result.push(item);
        }
    }

    return result;
}

/**
 * Ensures the given item is an array.
 * @param item
 */
export function toArray<T>(item: T | readonly T[] | undefined): T[] {
    if (item === void 0) {
        return [];
    }
    return Array.isArray(item) ? [...item] : [item];
}

export function* zip<T extends Iterable<any>[]>(
    ...args: T
): Iterable<{ [K in keyof T]: T[K] extends Iterable<infer U> ? U : T[K] }> {
    const iterators = args.map((x) => x[Symbol.iterator]());

    while (true) {
        const next = iterators.map((i) => i.next());
        if (next.some((v) => v.done)) {
            break;
        }
        yield next.map((v) => v.value) as any;
    }
}

export function filterMap<T, U>(
    arr: readonly T[],
    fn: (item: T, index: number) => U | undefined
): U[] {
    const result: U[] = [];

    arr.forEach((item, index) => {
        const newItem = fn(item, index);
        if (newItem !== void 0) {
            result.push(newItem);
        }
    });

    return result;
}

export function flatMap<T, U>(
    arr: readonly T[],
    fn: (item: T) => U | readonly U[]
): U[] {
    const result: U[] = [];

    for (const item of arr) {
        const newItem = fn(item);
        if (newItem instanceof Array) {
            result.push(...newItem);
        } else {
            result.push(newItem);
        }
    }

    return result;
}

export function partition<T>(
    arr: readonly T[],
    fn: (item: T) => boolean
): [T[], T[]] {
    const yes: T[] = [];
    const no: T[] = [];

    for (const item of arr) {
        (fn(item) ? yes : no).push(item);
    }

    return [yes, no];
}
