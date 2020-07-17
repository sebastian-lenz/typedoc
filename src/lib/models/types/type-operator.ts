import { Type, TypeKind } from "./abstract";
import { Serializer, BaseSerialized, Serialized } from "../../serialization";
import { SomeType } from ".";

/**
 * Represents a type operator type.
 *
 * ```ts
 * class A {}
 * class B<T extends keyof A> {}
 * ```
 */
export class TypeOperatorType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.TypeOperator;

  constructor(
    public target: SomeType,
    public operator: "keyof" | "unique" | "readonly"
  ) {
    super();
  }

  /** @inheritdoc */
  clone(): TypeOperatorType {
    return new TypeOperatorType(this.target.clone(), this.operator);
  }

  /** @inheritdoc */
  stringify(): string {
    return `${this.operator} ${this.target.stringify(false)}`;
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<TypeOperatorType>
  ): SerializedTypeOperatorType {
    return {
      ...init,
      operator: this.operator,
      target: serializer.toObject(this.target),
    };
  }
}

export interface SerializedTypeOperatorType
  extends Serialized<TypeOperatorType, "target" | "operator"> {}
