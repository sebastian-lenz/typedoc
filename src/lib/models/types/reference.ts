import { Reflection } from '../reflections/abstract';
import { Type } from './abstract';

/**
 * Represents a type that refers to another reflection like a class, interface or enum.
 *
 * ~~~
 * let value: MyClass;
 * ~~~
 */
export class ReferenceType extends Type {
    /**
     * The type name identifier.
     */
    readonly type = 'reference';

    /**
     * The name of the referenced type.
     *
     * If the symbol cannot be found cause it's not part of the documentation this
     * can be used to represent the type.
     */
    name: string;

    /**
     * The type arguments of this reference.
     */
    typeArguments?: Type[];

    /**
     * The fully qualified name of the referenced type as returned from the TypeScript compiler.
     *
     * After the all reflections have been generated this is can be used to lookup the
     * relevant reflection with [[ProjectReflection.getSymbolFromFQN]]. This property used to be
     * the internal ts.Symbol.id, but symbol IDs are not stable when dealing with imports.
     */
    symbolFullyQualifiedName: string;

    /**
     * The resolved reflection.
     *
     * The [[TypePlugin]] will try to set this property in the resolving phase.
     */
    reflection?: Reflection;

    /**
     * Special symbol FQN noting that the reference of a ReferenceType was known when creating the type.
     */
    static SYMBOL_FQN_RESOLVED = '///resolved';

    /**
     * Special symbol ID noting that the reference should be resolved by the type name.
     */
    static SYMBOL_FQN_RESOLVE_BY_NAME = '///resolve_by_name';

    /**
     * Create a new instance of ReferenceType.
     *
     * @param name        The name of the referenced type.
     * @param symbolID    The symbol id of the referenced type as returned from the TypeScript compiler.
     * @param reflection  The resolved reflection if already known.
     */
    constructor(name: string, symbolFQN: string, reflection?: Reflection) {
        super();
        this.name = name;
        this.symbolFullyQualifiedName = symbolFQN;
        this.reflection = reflection;
    }

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    clone(): Type {
        const clone = new ReferenceType(this.name, this.symbolFullyQualifiedName, this.reflection);
        clone.typeArguments = this.typeArguments;
        return clone;
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param other  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(other: ReferenceType): boolean {
        return other instanceof ReferenceType && (other.symbolFullyQualifiedName === this.symbolFullyQualifiedName || other.reflection === this.reflection);
    }
}
