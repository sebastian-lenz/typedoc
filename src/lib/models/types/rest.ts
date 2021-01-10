import { Type } from "./abstract";

/**
 * Represents a rest type
 * ```ts
 * type Z = [1, ...2[]]
 * //           ^^^^^^
 * ```
 */
export class RestType extends Type {
    /**
     * The type of the rest array elements.
     */
    elementType: Type;

    /**
     * The type name identifier.
     */
    readonly type = "rest";

    /**
     * Create a new RestType instance.
     *
     * @param elementType The type of the array's elements.
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
        return new RestType(this.elementType.clone());
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: Type): boolean {
        if (!(type instanceof RestType)) {
            return false;
        }
        return type.elementType.equals(this.elementType);
    }

    /**
     * Return a string representation of this type.
     */
    toString() {
        return `...${this.elementType.toString()}`;
    }
}
