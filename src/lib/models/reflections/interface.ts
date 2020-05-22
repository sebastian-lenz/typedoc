import { ContainerReflection, ReflectionKind } from './abstract';
import type { SignatureReflection, MethodReflection } from './signature';
import type { PropertyReflection } from './property';
import type { ReferenceType } from '../types';

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
export class InterfaceReflection extends ContainerReflection<MethodReflection | PropertyReflection> {
    readonly kind = ReflectionKind.Interface;

    signatures: SignatureReflection[];

    constructSignatures: SignatureReflection[];

    /**
     * References to all parent types.
     * ```ts
     * interface A { a: number }
     * interface B extends A, Readonly<{ b: number }>, Omit<A, 'a'> { }
     * ```
     */
    extendedTypes: ReferenceType[];

    constructor(name: string, signatures: SignatureReflection[], constructSignatures: SignatureReflection[], extendedTypes: ReferenceType[]) {
        super(name);
        this.signatures = signatures;
        this.constructSignatures = constructSignatures;
        this.extendedTypes = extendedTypes;
    }
}
