import { Type, TypeKind } from "./abstract";
import type { SomeType } from ".";
import assert = require("assert");
import type {
  Serialized,
  BaseSerialized,
  Serializer,
} from "../../serialization";

export class TupleNamedMemberType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.TupleMember;

  constructor(
    public name: string,
    public isOptional: boolean,
    public type: SomeType
  ) {
    super();
  }

  /** @inheritdoc */
  clone(): TupleNamedMemberType {
    return new TupleNamedMemberType(
      this.name,
      this.isOptional,
      this.type.clone()
    );
  }

  /** @inheritdoc */
  stringify(wrapped: boolean): string {
    assert(wrapped === false, "Tuple member types are never wrapped.");
    const tailModifier = this.isOptional ? "?" : "";
    return `${this.name}${tailModifier}: ${this.type}`;
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<TupleNamedMemberType>
  ): SerializedTupleNamedMemberType {
    return {
      ...init,
      name: this.name,
      isOptional: this.isOptional,
      type: serializer.toObject(this.type),
    };
  }
}

export interface SerializedTupleNamedMemberType
  extends Serialized<TupleNamedMemberType, "name" | "isOptional" | "type"> {}
