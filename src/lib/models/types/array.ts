import { Type } from './index';

/**
 * Represents an array type.
 *
 * ~~~
 * let value: string[];
 * ~~~
 */
export class ArrayType extends Type {

    /**
     * The type of the array elements.
     */
    elementType: Type;

    /**
     * The type name identifier.
     */
    readonly type = 'array';

    /**
     * Create a new TupleType instance.
     *
     * @param elementType  The type of the array's elements.
     */
    constructor(elementType: Type) {
        super();
        this.elementType = elementType;
    }

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    clone(): Type {
        return new ArrayType(this.elementType);
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: Type): boolean {
        if (!(type instanceof ArrayType)) {
            return false;
        }
        return type.elementType.equals(this.elementType);
    }
}
