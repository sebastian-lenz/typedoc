import { Type } from './abstract';

/**
 * Represents a string literal type.
 *
 * ~~~
 * let value: "DIV";
 * ~~~
 */
export class StringLiteralType extends Type {
    /**
     * The string literal value.
     */
    value: string;

    /**
     * The type name identifier.
     */
    readonly type = 'stringLiteral';

    /**
     * Create a new instance of StringLiteralType.
     *
     * @param value The string literal value.
     */
    constructor(value: string) {
        super();
        this.value = value;
    }

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    clone(): Type {
        return new StringLiteralType(this.value);
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: StringLiteralType): boolean {
        return type instanceof StringLiteralType &&
            type.value === this.value;
    }
}
