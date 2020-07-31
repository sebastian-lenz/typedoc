import { Type, TypeKind } from "./abstract";
import type { ReferenceType } from "./reference";
import type {
  Serializer,
  BaseSerialized,
  Serialized,
} from "../../serialization";

/**
 * Represents a type that is constructed by querying the type of a reflection.
 * ```ts
 * const x = 1
 * type Z = typeof x // query on reflection for x
 * ```
 */
export class QueryType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.Query;

  /**
   * A reference to the reflection whose type is being queried.
   */
  queryType: ReferenceType;

  constructor(reference: ReferenceType) {
    super();
    this.queryType = reference;
  }

  /** @inheritdoc */
  clone(): QueryType {
    return new QueryType(this.queryType.clone());
  }

  /** @inheritdoc */
  stringify(): string {
    return `typeof ${this.queryType}`;
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<QueryType>
  ): SerializedQueryType {
    return {
      ...init,
      queryType: serializer.toObject(this.queryType),
    };
  }
}

export interface SerializedQueryType
  extends Serialized<QueryType, "queryType"> {}
