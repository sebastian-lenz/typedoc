
export var fakePrivateVariable = 'test';


export var fakeProtectedVariable = 'test';




export function fakePrivateFunction() {}

/**
 * A function that is made protected via comment.
 * @protected
 */
export function fakeProtectedFunction() {}


export class PrivateClass
{
    /**
     * A variable that is made private via comment.
     * @private
     */
    fakePrivateVariable:string;

    /**
     * A variable that is made protected via comment.
     * @protected
     */
    fakeProtectedVariable:string;

    /**
     * A function that is made private via comment.
     * @private
     */
    fakePrivateFunction() {}

    /**
     * A function that is made protected via comment.
     * @protected
     */
    fakeProtectedFunction() {}
}

/**
 * A module that is documented as being private.
 * @private
 */
export module PrivateModule
{
    export function functionInsidePrivateModule() {}
}