/** A mapped generic type */
export type StringyValues<T extends {} = { prop: never }> = {
  [K in keyof T]-?: T[K] extends string ? T[K] : never;
}[keyof T];

/** Unwraps a promise type. */
export type UnwrapPromise<T> = T extends PromiseLike<infer U> ? U : T;

/** An intersection type */
export type Intersection = { a: string } & { readonly b: number };

/** A literal type */
export type Literal = -123n;

/** A unique symbol type */
export const Unique: unique symbol = Symbol();

/** Alias to make using `Unique` easier. */
export type Unique = typeof Unique;

/** A basic signature type. */
export type Signature = (...args: unknown[]) => 123;

/** A constructor type */
export type Ctor = new (x?: string) => any;

/** A recursive tuple */
export type Tuple = [string, number[], Tuple?];

/** A representation of a point using TS 4.x named tuples */
export type Point = [x: number, y: number];

/** A union type */
export type Union = 1 | 2;
