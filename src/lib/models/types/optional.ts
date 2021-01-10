import { Type } from "./abstract";
import { UnionType } from "./union";
import { IntersectionType } from "./intersection";

/**
 * Represents an optional type
 * ```ts
 * type Z = [1, 2?]
 * //           ^^
 * ```
 */
export class OptionalType extends Type {
    /**
     * The type of the rest array elements.
     */
    elementType: Type;

    /**
     * The type name identifier.
     */
    readonly type = "optional";

    /**
     * Create a new OptionalType instance.
     *
     * @param elementType The type of the element
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
        return new OptionalType(this.elementType.clone());
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: Type): boolean {
        if (!(type instanceof OptionalType)) {
            return false;
        }
        return type.elementType.equals(this.elementType);
    }

    /**
     * Return a string representation of this type.
     */
    toString() {
        if (
            this.elementType instanceof UnionType ||
            this.elementType instanceof IntersectionType
        ) {
            return `(${this.elementType.toString()})?`;
        }
        return `${this.elementType.toString()}?`;
    }
}
