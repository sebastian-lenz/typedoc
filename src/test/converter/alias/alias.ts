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
