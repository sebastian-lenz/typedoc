import type { SomeType } from ".";
import type {
  BaseSerialized,
  Serialized,
  Serializer,
} from "../../serialization";
import { Type, TypeKind } from "./abstract";

/**
 * Represents an indexed access type.
 */
export class IndexedAccessType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.IndexedAccess;

  constructor(public objectType: SomeType, public indexType: SomeType) {
    super();
  }

  /** @inheritdoc */
  clone(): IndexedAccessType {
    return new IndexedAccessType(
      this.objectType.clone(),
      this.indexType.clone()
    );
  }

  /** @inheritdoc */
  stringify(): string {
    // The index type is contained within brackets and does not need parenthesis, even if complex.
    return `${this.objectType.stringify(true)}[${this.indexType.stringify(
      false
    )}]`;
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<IndexedAccessType>
  ): SerializedIndexedAccessType {
    return {
      ...init,
      indexType: serializer.toObject(this.indexType),
      objectType: serializer.toObject(this.objectType),
    };
  }
}

export interface SerializedIndexedAccessType
  extends Serialized<IndexedAccessType, "objectType" | "indexType"> {}
