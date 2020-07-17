import { Reflection, ReflectionKind } from "./abstract";
import type { SomeType, TypeParameterType } from "../types";
import type {
  Serialized,
  Serializer,
  BaseSerialized,
} from "../../serialization";
import type { ObjectReflection } from "./object";

/**
 * Describes a type alias.
 *
 * ```ts
 * export type A = true
 * export type B = () => string
 * export type C<T extends { kind: string }> = T['kind']
 * ```
 */
export class TypeAliasReflection extends Reflection {
  readonly kind = ReflectionKind.Alias;

  typeParameters: TypeParameterType[];

  type: SomeType | ObjectReflection;

  constructor(
    name: string,
    type: SomeType | ObjectReflection,
    typeParameters: TypeParameterType[]
  ) {
    super(name);
    this.type = type;
    this.typeParameters = typeParameters;
  }

  serialize(
    serializer: Serializer,
    init: BaseSerialized<TypeAliasReflection>
  ): SerializedTypeAliasReflection {
    return {
      ...init,
      typeParameters: serializer.toObjects(this.typeParameters),
      type: serializer.toObject(this.type),
    };
  }
}

export interface SerializedTypeAliasReflection
  extends Serialized<TypeAliasReflection, "typeParameters" | "type"> {}
