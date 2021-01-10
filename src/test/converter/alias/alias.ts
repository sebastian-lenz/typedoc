/**
 * A type that describes a compare function, e.g. for array.sort().
 */
export type TCompareFunction<T> = (a: T, b: T) => number;

/**
 * A type for IDs.
 */
export type TId = number | string;

/**
 * Conditional types from TS2.8
 */
export type IsString<T> = T extends string ? "string" : "not string";

/**
 * Extracts the type of a promise.
 */
export type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

/**
 * Conditional type with infer
 */
export type PopFront<T extends any[]> = ((...args: T) => any) extends (
    a: any,
    ...r: infer R
) => any
    ? R
    : never;

/**
 * See GH#1150. Calling typeChecker.typeToString on this type will send TS into an infinite
 * loop, which is undesirable.
 */
export type HorribleRecursiveTypeThatShouldNotBeUsedByAnyone<
    T extends any[],
    R = {}
> = {
    0: R;
    1: HorribleRecursiveTypeThatShouldNotBeUsedByAnyone<
        PopFront<T>,
        {
            [K in keyof R | keyof T[0]]: K extends keyof R ? R[K] : T[0][K];
        }
    >;
}[T["length"] extends 0 ? 0 : 1];

export namespace GH1330 {
    export type ExampleParam = Example;
    export interface Example<T extends ExampleParam = ExampleParam> {}

    declare const makeExample: () => Example;
    declare const makeExample2: () => ExampleParam;

    // Recursive type when we don't have a type node.
    export const testValue = makeExample();
    export const testValue2 = makeExample2();

    export type HasProp<T> = { key: T };

    declare const makeProp: <T>(x: T) => HasProp<T>;
    export const testValue3 = makeProp(1);
}

export namespace GH1408 {
    export declare function foo<T extends unknown[]>(): T;
}

export namespace GH1454 {
    export type Foo = string | number;
    export type Bar = string | number;

    export declare function bar(x: Bar): Bar;
    export declare function foo(x: Foo): Foo;
}
