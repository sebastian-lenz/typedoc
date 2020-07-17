import { ContainerReflection, ReflectionKind } from "./abstract";
import type { SignatureReflection, MethodReflection } from "./signature";
import type { PropertyReflection } from "./property";
import type { ReferenceType, TypeParameterType } from "../types";
import type {
  Serializer,
  BaseSerialized,
  Serialized,
} from "../../serialization";

/**
 * Describes an interface.
 *
 * ```ts
 * interface Foo {
 *   // added to children
 *   member: string
 *   // added to children
 *   method(): string;
 *   // added to signatures
 *   (): string
 *   // added to construct signatures
 *   new(): HTMLElement
 * }
 * ```
 */
export class InterfaceReflection extends ContainerReflection<
  MethodReflection | PropertyReflection
> {
  readonly kind = ReflectionKind.Interface;

  signatures: SignatureReflection[];

  constructSignatures: SignatureReflection[];

  typeParameters: TypeParameterType[];

  /**
   * References to all parent types.
   * ```ts
   * interface A { a: number }
   * interface B extends A, Readonly<{ b: number }>, Omit<A, 'a'> { }
   * ```
   */
  extendedTypes: ReferenceType[];

  constructor(
    name: string,
    signatures: SignatureReflection[],
    constructSignatures: SignatureReflection[],
    typeParameters: TypeParameterType[],
    extendedTypes: ReferenceType[]
  ) {
    super(name);
    this.signatures = signatures;
    this.constructSignatures = constructSignatures;
    this.typeParameters = typeParameters;
    this.extendedTypes = extendedTypes;
  }

  serialize(
    serializer: Serializer,
    init: BaseSerialized<InterfaceReflection>
  ): SerializedInterfaceReflection {
    return {
      ...init,
      signatures: serializer.toObjects(this.signatures),
      constructSignatures: serializer.toObjects(this.constructSignatures),
      typeParameters: serializer.toObjects(this.typeParameters),
      extendedTypes: serializer.toObjects(this.extendedTypes),
    };
  }
}

export interface SerializedInterfaceReflection
  extends Serialized<
    InterfaceReflection,
    "signatures" | "constructSignatures" | "typeParameters" | "extendedTypes"
  > {}
