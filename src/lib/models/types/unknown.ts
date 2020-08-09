import { Type } from './abstract';

/**
 * Represents all unknown types.
 */
export class UnknownType extends Type {
    /**
     * A string representation of the type as returned from TypeScript compiler.
     */
    name: string;

    /**
     * The type name identifier.
     */
    readonly type = 'unknown';

    /**
     * Create a new instance of UnknownType.
     *
     * @param name  A string representation of the type as returned from TypeScript compiler.
     */
    constructor(name: string) {
        super();
        this.name = name;
    }

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    clone(): Type {
        return new UnknownType(this.name);
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: UnknownType): boolean {
        return type instanceof UnknownType &&
            type.name === this.name;
    }
}
