import { Type } from './abstract';

/**
 * Represents an intrinsic type like `string` or `boolean`.
 *
 * ~~~
 * let value: number;
 * ~~~
 */
export class IntrinsicType extends Type {
    /**
     * The name of the intrinsic type like `string` or `boolean`.
     */
    name: string;

    /**
     * The type name identifier.
     */
    readonly type = 'intrinsic';

    /**
     * Create a new instance of IntrinsicType.
     *
     * @param name  The name of the intrinsic type like `string` or `boolean`.
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
        return new IntrinsicType(this.name);
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: IntrinsicType): boolean {
        return type instanceof IntrinsicType &&
            type.name === this.name;
    }
}
