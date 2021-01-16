/**
 * A class that contains members with flattened properties.
 */
export class FlattenedClass {
    /**
     * A member that accepts an option object defined inline.
     *
     * @param options.value                   A value on the options object parameter.
     * @param options.anotherValue            Another value on the options object parameter.
     * @param options.moreOptions             A typed child object of the options object.
     * @param options.moreOptions.moreValues  A value of the typed child object.
     * @param options.emptyObject             An empty object
     */
    options: {
        value?: string;
        anotherValue?: string;
        moreOptions?: {
            moreValues: number;
        };
        emptyObject: {};
    };

    /**
     * A member that holds a callback that requires a typed function signature.
     *
     * @param callback.param          A parameter of the typed function callback.
     * @param callback.optionalParam  An optional parameter of the typed function callback.
     */
    callback: (param: number, optionalParam?: string) => string;

    /**
     * A member that holds an index signature.
     *
     * @param indexed.index  The index property comment.
     * @param indexed.test   A property of the index signature instance.
     */
    indexed: {
        [index: number]: { name: string; value?: number };
        test: string;
    };

    /**
     * An object with multiple call signatures.
     * @see https://github.com/TypeStrong/typedoc/issues/27
     */
    public multipleCallSignatures: {
        /**
         * Simple call signature.
         * @returns The current value.
         */
        (): number;
        /**
         * Call signature with parameters.
         * @param value The desired value.
         * @returns The calling Foo.
         */
        (value: number): FlattenedClass;
    };

    /**
     * Single call signature.
     */
    public singleCallSignature: (...args: string[]) => () => string;

    /**
     * Rendering edge case: the function needs to be wrapped in parens or the type changes.
     */
    unionAndFunction: (() => 1) | 2;

    /**
     * A constructor that accepts an option object defined inline.
     *
     * @param options                         The inline typed options object.
     * @param options.value                   A value on the options object parameter.
     * @param options.anotherValue            Another value on the options object parameter.
     * @param options.moreOptions             A typed child object of the options object.
     * @param options.moreOptions.moreValues  A value of the typed child object.
     */
    constructor(options: {
        value?: string;
        anotherValue?: string;
        moreOptions?: {
            moreValues: number;
        };
    }) {}
}

/**
 * A function that has a parameter that requires a typed function callback.
 *
 * @param callback                The typed function callback.
 * @param callback.param          A parameter of the typed function callback.
 * @param callback.optionalParam  An optional parameter of the typed function callback.
 */
export function flattenedCallback(
    callback: (param: number, optionalParam?: string) => string
) {}

/**
 * A function that accepts an option object defined inline.
 *
 * @param options                         The inline typed options object.
 * @param options.value                   A value on the options object parameter.
 * @param options.anotherValue            Another value on the options object parameter.
 * @param options.moreOptions             A typed child object of the options object.
 * @param options.moreOptions.moreValues  A value of the typed child object.
 */
export function flattenedParameter(options: {
    [name: string]: any;
    value?: string;
    anotherValue?: string;
    moreOptions?: {
        moreValues: number;
    };
}) {}

/**
 * A function that accepts an index signature parameter.
 *
 * @param indexed        The index signature parameter.
 * @param indexed.index  The index property comment.
 * @param indexed.test   A property of the index signature instance.
 */
export function flattenedIndexSignature(indexed: {
    [index: number]: { name: string; value?: number };
    test: string;
}) {}
