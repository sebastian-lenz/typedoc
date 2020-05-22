import { SomeType } from '.';

/**
 * Base class of all type definitions.
 */
export abstract class Type {
    /**
     * The type name identifier.
     */
    abstract readonly type: string;

    /**
     * Make a deep clone of this type.
     */
    abstract clone(): SomeType;

    /**
     * Stringifies this type, the `wrapped` parameter is used to determine if complex types should be
     * wrapped in parenthesis.
     * @internal
     */
    abstract stringify(wrapped: boolean): string;

    /**
     * Return a string representation of this type.
     */
    toString() {
        return this.stringify(false);
    }
}
