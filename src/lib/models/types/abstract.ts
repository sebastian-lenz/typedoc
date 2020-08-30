import type { SomeType, TypeToSerialized } from ".";
import { makeToKindArray, makeToKindString } from "../../utils/enum";
import type { Serializer, BaseSerialized } from "../../serialization";

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
  Constructor = 4096,
  SignatureParameter = 8192,
  Literal = 16384,
  Tuple = 32768,
  TypeOperator = 65536,
  TypeParameter = 131072,
  Union = 262144,
  Unknown = 524288,
  Mapped = 1048576,
  TupleMember = 2097152,
  Optional = 4194304,
}

export namespace TypeKind {
  const LAST_KIND = TypeKind.Optional;

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
  abstract clone(): Type;

  /**
   * Stringifies this type, the `wrapped` parameter is used to determine if complex types should be
   * wrapped in parenthesis.
   * @internal
   */
  abstract stringify(wrapped: boolean): string;

  /**
   * Serialize this type to a JSON object.
   */
  abstract serialize(
    serializer: Serializer,
    init: BaseSerialized<SomeType>
  ): TypeToSerialized<SomeType>;

  /**
   * Return a string representation of this type.
   */
  toString(): string {
    return this.stringify(false);
  }
}
