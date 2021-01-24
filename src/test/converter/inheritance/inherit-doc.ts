/**
 * Source interface summary
 *
 * @typeParam T - Source interface type parameter
 */
export interface InterfaceSource<T> {
    /**
     * Source interface property description
     *
     * @typeParam T - Source interface type parameter
     */
    property: T;

    /**
     * Source interface method description
     *
     * @param arg
     */
    someMethod(arg: number): T;
}

/**
 * @inheritDoc InterfaceSource
 *
 */
export interface InterfaceTarget<T> {
    /**
     * @inheritDoc InterfaceSource.property
     */
    property: T;

    /**
     * @inheritDoc InterfaceSource.someMethod
     *
     * @param arg
     */
    someMethod(arg: number): T;
}

/**
 * Function summary
 *
 * This part of the commentary will be inherited by other entities
 *
 * @remarks
 *
 * Remarks will be inherited
 *
 * @example
 *
 * This part of the commentary will not be inherited
 *
 * @typeParam T - Type of arguments
 * @param arg1 - First argument
 * @param arg2 - Second argument
 * @returns Stringified sum or concatenation of numeric arguments
 */
export function functionSource<T>(arg1: T, arg2: T): string {
    if (typeof arg1 === "number" && typeof arg2 === "number") {
        return `${arg1 + arg2}`;
    }
    return `${arg1}${arg2}`;
}

/**
 * @inheritDoc SubClassA.printName
 */
export function functionTargetGlobal() {
    return "";
}

/**
 * @inheritDoc functionSource
 *
 * @example
 *
 * This function inherited commentary from the `functionSource` function
 *
 * @typeParam T - This will be inherited
 * @param arg1 - This will be inherited
 * @param arg2 - This will be inherited
 * @returns This will be inherited
 *
 */
export function functionTargetLocal<T>(arg1: T, arg2: T) {
    return "";
}
