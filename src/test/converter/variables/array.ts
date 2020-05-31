/**
 * A custom array interface.
 * Note that this **does not** merge with the global Array type.
 * As such, `Array` instances denoted with `Array<T>` in this file **are not** actually arrays.
 */
export interface Array<T> {
}

/**
 * A const of a complex type.
 */
export const complex: ((Array<string>[] | number[])[] | string)[][] = [];

/**
 * An exported const of the custom array type.
 */
export const custom: Array<number> = {};

/**
 * Class array class item
 */
export class Foo {}

/**
 * Custom list class
 */
export class FooList extends Array<Foo> {}
