import { Type } from './index';

/**
 * Represents an indexed access type.
 */
export class IndexedAccessType extends Type {
    /**
     * The type name identifier.
     */
    readonly type = 'indexedAccess';

    /**
     * Create a new TupleType instance.
     *
     * @param elementType  The type of the array's elements.
     */
    constructor(public objectType: Type, public indexType: Type) {
        super();
    }

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    clone(): Type {
        return new IndexedAccessType(this.objectType, this.indexType);
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: Type): boolean {
        if (!(type instanceof IndexedAccessType)) {
            return false;
        }
        return type.objectType.equals(this.objectType) && type.indexType.equals(this.indexType);
    }
}
