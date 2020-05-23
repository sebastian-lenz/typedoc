import { SomeType, TypeToSerialized } from '.';
import { makeToKindArray, makeToKindString } from '../../utils/enum';
import { Serializer, BaseSerialized } from '../../serialization';

/**
 * Defines the available type kinds. Analogous to the {@link ReflectionKind}
 * enum for reflections.
 */
export enum TypeKind {
    Array = 1,
    Conditional = 2,
    IndexedAccess = 4,
    Inferred = 8,
    Intersection = 16,
    Intrinsic = 32,
    Object = 64,
    Property = 128,
    Predicate = 256,
    Query = 512,
    Reference = 1024,
    Signature = 2048,
    SignatureParameter = 4096,
    StringLiteral = 8192,
    Tuple = 16384,
    TypeOperator = 32768,
    TypeParameter = 65536,
    Union = 131072,
    Unknown = 262144
}

export namespace TypeKind {
    const LAST_KIND = TypeKind.Unknown;

    // tslint:disable-next-line
    export const All: TypeKind = LAST_KIND * 2 - 1;

    export const toKindArray = makeToKindArray(LAST_KIND);

    export const toKindString = makeToKindString(TypeKind);
}

/**
 * Base class of all type definitions.
 */
export abstract class Type {
    abstract readonly kind: TypeKind;

    /**
     * Make a deep clone of this type.
     */
    abstract clone(): SomeType;

    /**
     * Stringifies this type, the `wrapped` parameter is used to determine if complex types should be
     * wrapped in parenthesis.
     * @internal
     */
    abstract stringify(wrapped: boolean): string;

    /**
     * Serialize this type to a JSON object.
     */
    abstract serialize(serializer: Serializer, init: BaseSerialized<SomeType>): TypeToSerialized<SomeType>;

    /**
     * Return a string representation of this type.
     */
    toString() {
        return this.stringify(false);
    }
}
