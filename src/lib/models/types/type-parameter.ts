import { Type } from './abstract';

/**
 * Represents a type parameter type.
 *
 * ~~~
 * let value: T;
 * ~~~
 */
export class TypeParameterType extends Type {
    /**
     *
     */
    readonly name: string;

    constraint?: Type;

    /**
     * The type name identifier.
     */
    readonly type: string = 'typeParameter';

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
        const clone = new TypeParameterType(this.name);
        clone.constraint = this.constraint;
        return clone;
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: TypeParameterType): boolean {
        if (!(type instanceof TypeParameterType)) {
            return false;
        }

        if (this.constraint && type.constraint) {
            return type.constraint.equals(this.constraint);
        } else if (!this.constraint && !type.constraint) {
            return true;
        } else {
            return false;
        }
    }
}
