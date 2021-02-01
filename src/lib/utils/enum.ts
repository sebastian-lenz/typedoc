export function getEnumFlags<T extends number>(flags: T): T[] {
    const result: T[] = [];
    for (let i = 1; i <= flags; i *= 2) {
        if (flags & i) {
            result.push(i as T);
        }
    }

    return result;
}

// T & {} reduces inference priority
export function removeFlag<T extends number>(flag: T, remove: T & {}): T {
    return ((flag ^ remove) & flag) as T;
}

export function hasAllFlags(flags: number, check: number): boolean {
    return (flags & check) === check;
}

export function hasAnyFlag(flags: number, check: number): boolean {
    return (flags & check) !== 0;
}
