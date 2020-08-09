import { Type } from './abstract';

/**
 * Represents a type predicate.
 *
 * ```ts
 * function isString(anything: any): anything is string {}
 * function assert(condition: boolean): asserts condition {}
 * ```
 */
export class PredicateType extends Type {
    /**
     * The type that the identifier is tested to be.
     * May be undefined if the type is of the form `asserts val`.
     * Will be defined if the type is of the form `asserts val is string` or `val is string`.
     */
    targetType?: Type;

    /**
     * The identifier name which is tested by the predicate.
     */
    name: string;

    /**
     * True if the type is of the form `asserts val is string`, false if
     * the type is of the form `val is string`
     */
    asserts: boolean;

    /**
     * The type name identifier.
     */
    readonly type = 'predicate';

    /**
     * Create a new PredicateType instance.
     */
    constructor(name: string, asserts: boolean, targetType?: Type) {
        super();
        this.name = name;
        this.asserts = asserts;
        this.targetType = targetType;
    }

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    clone(): Type {
        return new PredicateType(this.name, this.asserts, this.targetType);
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: Type): boolean {
        if (!(type instanceof PredicateType)) {
            return false;
        }

        if (!this.targetType && type.targetType) {
            return false;
        }
        if (this.targetType && !type.targetType) {
            return false;
        }

        return this.name === type.name
            && this.asserts === type.asserts
            && (this.targetType?.equals(type.targetType!) ?? true);
    }
}
