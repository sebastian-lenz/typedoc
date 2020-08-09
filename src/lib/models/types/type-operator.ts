import { Type } from './abstract';

/**
 * Represents a type operator type.
 *
 * ~~~
 * class A {}
 * class B<T extends keyof A> {}
 * ~~~
 */
export class TypeOperatorType extends Type {
    /**
     * The type name identifier.
     */
    readonly type = 'typeOperator';

    target: Type;

    // currently, there is only one type operator, this is always "keyof"
    // but, if more types will be added in the future we are ready.
    readonly operator = 'keyof';

    constructor(target: Type) {
        super();
        this.target = target;
    }

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    clone(): Type {
        return new TypeOperatorType(this.target.clone());
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: TypeOperatorType): boolean {
        if (!(type instanceof TypeOperatorType)) {
            return false;
        }

        return type.target.equals(this.target);
    }
}
