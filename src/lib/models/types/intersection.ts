import { Type, TypeKind, SomeType } from ".";
import { cloned, wrap } from "./utils";
import { Serializer, BaseSerialized, Serialized } from "../../serialization";

/**
 * Represents an intersection type.
 *
 * ```ts
 * let value: A & B;
 * ```
 */
export class IntersectionType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.Intersection;

  /**
   * The types this intersection consists of.
   */
  types: SomeType[];

  constructor(types: SomeType[]) {
    super();
    this.types = types;
  }

  /** @inheritdoc */
  clone(): IntersectionType {
    return new IntersectionType(cloned(this.types));
  }

  /** @inheritdoc */
  stringify(wrapped: boolean): string {
    return wrap(
      wrapped,
      this.types.map((type) => type.stringify(true)).join(" & ")
    );
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<IntersectionType>
  ): SerializedIntersectionType {
    return {
      ...init,
      types: serializer.toObjects(this.types),
    };
  }
}

export interface SerializedIntersectionType
  extends Serialized<IntersectionType, "types"> {}
