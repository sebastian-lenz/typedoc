import { ContainerReflection, ReflectionKind } from './abstract';
import type { SignatureReflection, MethodReflection } from './signature';
import type { PropertyReflection } from './property';
import type { ReferenceType } from '../types';
import { Serializer, BaseSerialized, Serialized } from '../../serialization';

/**
 * Describes a class.
 *
 * ```ts
 * class Foo {
 *   // added to children
 *   member: string
 *   static member: string
 *   method(): string;
 *   static method(): string;
 *   // added to construct signatures
 *   constructor();
 *   constructor(a: string);
 * }
 *
 * interface Foo extends Bar {
 *   //
 *   // added to signatures
 *   (): string
 * }
 * ```
 */
export class ClassReflection extends ContainerReflection<MethodReflection | PropertyReflection> {
    readonly kind = ReflectionKind.Class;

    /**
     * Any call signatures for this class.
     *
     * Classes normally do not contain signatures, however, they can be added to a class through declaration
     * merging with an interface of the same name. This is the only type of declaration merging supported by
     * TypeDoc since it modifies the type of the class instance.
     * While classes and namespaces can be merged, effectively giving the class more static properties,
     * this tends to produce worse output than not merging them. See GH#1244 for more info.
     */
    signatures: SignatureReflection[];

    /**
     * All constructors for this class.
     */
    constructSignatures: SignatureReflection[];

    /**
     * A reference to the parent class, if this class extends another class.
     *
     * ```ts
     * class A {} // extendedType is undefined
     * class B extends A {} // extendedType is A
     * class C extends B {} // extendedType is B
     * ```
     */
    extendedType?: ReferenceType;

    /**
     * All types implemented by this class. Implementing types can appear in two positions.
     *
     * `A`, `B`, and `C` are all considered implemented types.
     * ```ts
     * class Cls implements A, B {}
     * interface Cls extends C {}
     * ```
     */
    implementedTypes: ReferenceType[];

    constructor(name: string, signatures: SignatureReflection[], constructSignatures: SignatureReflection[], implementedTypes: ReferenceType[]) {
        super(name);
        this.signatures = signatures;
        this.constructSignatures = constructSignatures;
        this.implementedTypes = implementedTypes;
    }

    serialize(serializer: Serializer, init: BaseSerialized<ClassReflection>): SerializedClassReflection {
        const result: SerializedClassReflection = {
            ...init,
            signatures: serializer.toObjects(this.signatures),
            constructSignatures: serializer.toObjects(this.constructSignatures),
            implementedTypes: serializer.toObjects(this.implementedTypes),
        }

        if (this.extendedType) {
            result.extendedType = serializer.toObject(this.extendedType)
        }

        return result;
    }
}

export interface SerializedClassReflection extends Serialized<ClassReflection, 'signatures' | 'constructSignatures' | 'extendedType' | 'implementedTypes'> {
}
