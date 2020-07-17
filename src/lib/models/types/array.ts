import type { SomeType } from ".";
import type {
  Serializer,
  BaseSerialized,
  Serialized,
} from "../../serialization";
import { Type, TypeKind } from "./abstract";

/**
 * Represents an array type.
 *
 * ```ts
 * type A = string[];
 * type B = Array<string>;
 * ```
 */
export class ArrayType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.Array;

  /**
   * The type of the array elements.
   */
  elementType: SomeType;

  constructor(elementType: SomeType) {
    super();
    this.elementType = elementType;
  }

  /** @inheritdoc */
  clone(): ArrayType {
    return new ArrayType(this.elementType.clone());
  }

  /** @inheritdoc */
  stringify(wrapped: boolean): string {
    return this.elementType.stringify(true) + "[]";
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<ArrayType>
  ): SerializedArrayType {
    return {
      ...init,
      elementType: serializer.toObject(this.elementType),
    };
  }
}

export interface SerializedArrayType
  extends Serialized<ArrayType, "elementType"> {}
