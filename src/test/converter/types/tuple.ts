export type NamedTuple = [name: string, optionalName?: number];

export const namedTuple = returnMapped<NamedTuple>();

export function gh1449<T extends [foo: any, bar?: any]>(a: T): T {
    return a;
}

export type WithRestType = [1, ...2[]];
export const withRestType = returnMapped<WithRestType>();

export type WithRestTypeNames = [a: 123, ...b: 456[]];
export const withRestTypeNames = returnMapped<WithRestTypeNames>();

export type WithOptionalElements = [1, 2?, 3?];
export const withOptionalElements = returnMapped<WithOptionalElements>();

// Helper to force TS to give us types, rather than type nodes, for a given declaration.
function returnMapped<T>() {
    return ({} as any) as { [K in keyof T]: T[K] };
}
