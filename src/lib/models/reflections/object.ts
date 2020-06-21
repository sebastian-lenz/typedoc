import { ContainerReflection, ReflectionKind } from './abstract';
import type { SignatureReflection, MethodReflection } from './signature';
import type { PropertyReflection } from './property';
import type { TypeParameterType } from '../types';
import type { Serializer, BaseSerialized, Serialized } from '../../serialization';

/**
 * Describes an object type.
 *
 * Object reflections are almost identical to interfaces, but are produced
 * from inline object types and type aliases. Object reflections are special
 * in that they may be contained within a property which also includes types.
 * This inconsistency is intentional since it allows comments to be included within
 * type aliases, which would otherwise only be documentable at the top level.
 *
 * Object reflections *mostly* replace TypeDoc's old ReflectionType. This decision
 * was made to clarify where comments are permitted. It doesn't make sense to include
 * documentation within an indexed access type, but type-alias-interfaces should be
 * documentable. This is a tradeoff from permitting comments everywhere (generated
 * docs explode in complexity), and only allowing them on top level reflections
 * (common patterns using some libraries don't work)
 *
 * ```ts
 * type Foo = {
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
export class ObjectReflection extends ContainerReflection<MethodReflection | PropertyReflection> {
    readonly kind = ReflectionKind.Object;

    signatures: SignatureReflection[];

    constructSignatures: SignatureReflection[];

    typeParameters: TypeParameterType[];

    constructor(name: string,
        signatures: SignatureReflection[],
        constructSignatures: SignatureReflection[],
        typeParameters: TypeParameterType[]) {

        super(name);
        this.signatures = signatures;
        this.constructSignatures = constructSignatures;
        this.typeParameters = typeParameters;
    }

    serialize(serializer: Serializer, init: BaseSerialized<ObjectReflection>): SerializedObjectReflection {
        return {
            ...init,
            signatures: serializer.toObjects(this.signatures),
            constructSignatures: serializer.toObjects(this.constructSignatures),
            typeParameters: serializer.toObjects(this.typeParameters)
        };
    }
}

export interface SerializedObjectReflection extends Serialized<ObjectReflection, 'signatures' | 'constructSignatures' | 'typeParameters'> {
}
