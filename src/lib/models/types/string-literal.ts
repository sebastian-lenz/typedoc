import { Type, TypeKind } from "./abstract";
import type { BaseSerialized, Serialized } from "../../serialization";

/**
 * BigInt values cannot be passed to JSON.stringify, and are not supported in all
 * supported Node versions yet.
 */
export interface PseudoBigInt {
  negative: boolean;
  /** Base 10 */
  value: string;
}

/**
 * Represents a literal type.
 *
 * ```ts
 * type Str = "DIV";
 * type Num = 1;
 * type Num2 = -1;
 * type Bool = true;
 * type Z = 123n;
 * ```
 */
export class LiteralType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.Literal;

  /**
   * The literal value.
   */
  value: string | number | boolean | PseudoBigInt;

  constructor(value: string | number | boolean | PseudoBigInt) {
    super();
    this.value = value;
  }

  /** @inheritdoc */
  clone(): LiteralType {
    return new LiteralType(this.value);
  }

  /** @inheritdoc */
  stringify(): string {
    if (typeof this.value === "object") {
      return `${this.value.negative ? "-" : ""}${this.value.value}n`;
    }
    return JSON.stringify(this.value);
  }

  /** @inheritdoc */
  serialize(
    _serializer: unknown,
    init: BaseSerialized<LiteralType>
  ): SerializedLiteralType {
    return {
      ...init,
      value: this.value,
    };
  }
}

export interface SerializedLiteralType
  extends Serialized<LiteralType, "value"> {}
