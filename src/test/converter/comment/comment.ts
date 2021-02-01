/**
 * This is a module doc comment with legacy behavior.
 */
/** dummy comment */
import "./comment2";

/**
 * A Comment for a class
 *
 * ## Some Markup
 * **with more markup**
 *
 * An example with decorators that should not parse to tag
 * ```
 * @myDecorator
 * @FactoryDecorator('a', 'b', 'c')
 * export class CommentedClass {
 *   myProp: string = 'myProp';
 *
 *   @PropDecorator() decoratedProp: string;
 *
 *   constructor(@ParamDecorator public param: string) { }
 *
 *   myMethod() { }
 * }
 * ```
 * @deprecated
 * @todo something
 *
 * @class will be removed
 * @type {Data<object>} will also be removed
 */
export class CommentedClass {
    /**
     * The main prop
     */
    prop: string;

    /**
     * @hidden
     */
    hiddenprop: string;

    /**
     * Hidden function
     * @hidden
     */
    hidden(...args: any[]): void {}

    /**
     * Single hidden signature
     * @hidden
     */
    hiddenWithImplementation(arg: any);
    hiddenWithImplementation(...args: any[]): void {}

    /**
     * Multiple hidden 1
     * @hidden
     */
    multipleHidden(arg: any);
    /**
     * Multiple hidden 2
     * @hidden
     */
    multipleHidden(arg1: any, arg2: any);
    multipleHidden(...args: any[]): void {}

    /**
     * Mixed hidden 1
     * @hidden
     */
    mixedHidden(arg: any);
    /**
     * Mixed hidden 2
     */
    mixedHidden(arg1: any, arg2: any);
    mixedHidden(...args: any[]): void {}

    /**
     * @ignore
     */
    ignoredprop: string;
}

/** Function description
 *
 *  @param scope {@link CommentedClass} Test description.
 *  @returns Test description.
 */
export function gh1164(scope: string) {
    return scope;
}

export interface GH1490 {
    /** With comment */
    optionalMethod?(): void;
}
