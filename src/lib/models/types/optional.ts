import { ok as assert } from "assert";
import { SomeType, Type, TypeKind } from ".";
import type {
  BaseSerialized,
  Serialized,
  Serializer,
} from "../../serialization";

/**
 * Represents an optional type, `string?` in the example below.
 *
 * ```ts
 * type Z = [string?]
 * ```
 */
export class OptionalType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.Optional;

  constructor(public type: SomeType) {
    super();
  }

  /** @inheritdoc */
  clone(): OptionalType {
    return new OptionalType(this.type.clone());
  }

  /** @inheritdoc */
  stringify(wrapped: boolean): string {
    assert(wrapped == false);
    return this.type.stringify(true) + "?";
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<OptionalType>
  ): SerializedOptionalType {
    return {
      ...init,
      type: serializer.toObject(this.type),
    };
  }
}

export interface SerializedOptionalType
  extends Serialized<OptionalType, "type"> {}
