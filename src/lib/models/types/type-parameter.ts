import * as assert from "assert";
import { Type, TypeKind } from "./abstract";
import { Serializer, BaseSerialized, Serialized } from "../../serialization";
import { SomeType } from ".";

/**
 * Represents a type parameter type.
 *
 * ```ts
 * function test<T extends string = 'bar'>() {
 *   // here     ^^^^^^^^^^^^^^^^^^^^^^^^
 *   let value: T;
 *   // but not ^ this is a reference
 * }
 * ```
 */
export class TypeParameterType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.TypeParameter;

  constructor(
    public name: string,
    public constraint?: SomeType,
    public defaultValue?: SomeType
  ) {
    super();
    this.name = name;
    this.constraint = constraint;
    this.defaultValue = defaultValue;
  }

  /** @inheritdoc */
  clone(): TypeParameterType {
    return new TypeParameterType(
      this.name,
      this.constraint?.clone(),
      this.defaultValue?.clone()
    );
  }

  /** @inheritdoc */
  stringify(wrapped: boolean): string {
    assert(
      wrapped === false,
      "Type parameters should never be wrapped in another type."
    );
    const extendsClause = this.constraint ? ` extends ${this.constraint}` : "";
    const defaultClause = this.defaultValue ? ` = ${this.defaultValue}` : "";
    return this.name + extendsClause + defaultClause;
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<TypeParameterType>
  ): SerializedTypeParameterType {
    const result: SerializedTypeParameterType = {
      ...init,
      name: this.name,
    };

    if (this.constraint) {
      result.constraint = serializer.toObject(this.constraint);
    }

    if (this.defaultValue) {
      result.defaultValue = serializer.toObject(this.defaultValue);
    }

    return result;
  }
}

export interface SerializedTypeParameterType
  extends Serialized<
    TypeParameterType,
    "name" | "constraint" | "defaultValue"
  > {}
