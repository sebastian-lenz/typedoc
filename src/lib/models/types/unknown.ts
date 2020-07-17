import { Type, TypeKind } from "./abstract";
import { BaseSerialized, Serialized } from "../../serialization";

/**
 * Represents all unknown types.
 * Note that this is *not* equivalent to TypeScript's `unknown` type. TypeScript's
 * `unknown` type is an {@link IntrinsicType}. This type is reserved for reference types which
 * target reflections that do not exist in the documentation and for types which TypeDoc doesn't
 * know how to convert yet.
 */
export class UnknownType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.Unknown;

  /**
   * A string representation of the type as returned from TypeScript compiler.
   */
  name: string;

  /**
   * Create a new instance of UnknownType.
   *
   * @param name A string representation of the type as returned from TypeScript compiler.
   */
  constructor(name: string) {
    super();
    this.name = name;
  }

  /** @inheritdoc */
  clone() {
    return new UnknownType(this.name);
  }

  /** @inheritdoc */
  stringify() {
    return this.name;
  }

  /** @inheritdoc */
  serialize(
    _serializer: unknown,
    init: BaseSerialized<UnknownType>
  ): SerializedUnknownType {
    return {
      ...init,
      name: this.name,
    };
  }
}

export interface SerializedUnknownType
  extends Serialized<UnknownType, "name"> {}
