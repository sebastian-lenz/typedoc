/**
 * A variable that is made private via comment.
 * @private
 */
export const fakePrivateVariable = "test";

/**
 * A variable that is made protected via comment.
 * @protected
 */
export const fakeProtectedVariable = "test";

/**
 * A function that is made private via comment.
 * @private
 */
export function fakePrivateFunction() {}

/**
 * A function that is made protected via comment.
 * @protected
 */
export function fakeProtectedFunction() {}

/**
 * A class that is documented as being private.
 * @private
 */
export class PrivateClass {
    /**
     * A variable that is made private via comment.
     * @private
     */
    fakePrivateProperty: string;

    /**
     * A variable that is made protected via comment.
     * @protected
     */
    fakeProtectedProperty: string;

    /**
     * A function that is made private via comment.
     * @private
     */
    fakePrivateMethod() {}

    /**
     * A function that is made protected via comment.
     * @protected
     */
    fakeProtectedMethod() {}

    private privateArrow = () => {};

    /** @hidden - should not show up */
    constructor() {}
}
