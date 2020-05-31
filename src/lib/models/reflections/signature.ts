import type { BaseSerialized, Serialized, Serializer } from '../../serialization';
import type { SomeType, TypeParameterType } from '../types/index';
import { Reflection, ReflectionKind } from './abstract';
import type { ObjectReflection } from './object';
import type { ParameterReflection } from './parameter';

export abstract class CallableReflection extends Reflection {
    signatures: SignatureReflection[] = [];
}

/**
 * Represents a function exported from a module or namespace.
 *
 * Functions attached to classes or interfaces are represented by a {@link MethodReflection}
 * Both arrow functions (`export const a = () => 1`) and function expressions
 * (`export const a = function(){}`) are converted to a function reflection.
 */
export class FunctionReflection extends CallableReflection {
    readonly kind = ReflectionKind.Function;

    serialize(serializer: Serializer, init: BaseSerialized<FunctionReflection>): SerializedFunctionReflection {
        return {
            ...init,
            signatures: serializer.toObjects(this.signatures)
        };
    }
}

export interface SerializedFunctionReflection extends Serialized<FunctionReflection, 'signatures'> {
}


/**
 * Represents a method on a class or interface.
 */
export class MethodReflection extends CallableReflection {
    readonly kind = ReflectionKind.Method;

    /**
     * The method on the parent class or interface which this method overwrites.
     *
     * Note that this is appropriately named. Unless types are identical, subclasses may specify methods
     * which overwrite, rather than implement, parent interfaces. This can be partially mitigated with
     * strictFunctionTypes, but even then only applies to function properties, not class methods.
     *
     * ```ts
     * interface A { method(): string }
     * interface B extends A { method(): 'b' }
     * class Impl implements B {
     *   // Even though this implements A, which B extends, it does not meet the requirements for B.
     *   // So B's method() *overwrites* A's method().
     *   method() { // Error: Type 'string' is not assignable to type '"b"'
     *     return 'impl'
     *   }
     * }
     * ```
     *
     * This is a TypeScript design limitation. See Microsoft/TypeScript#22156. The default theme presents
     * methods as "overridden" instead of "overwritten", this is a compromise since most cases will not
     * intentionally overwrite methods. See GH#271.
     */
    get overwrites(): MethodReflection | undefined {
        return this._overwrites
            ? this.project?.getReflectionById(this._overwrites) as MethodReflection | undefined
            : undefined;
    }

    set overwrites(value: MethodReflection | undefined) {
        this._overwrites = value?.id;
    }

    /**
     * The method on the parent class or interface which this signature is inherited from.
     */
    get inheritedFrom(): MethodReflection | undefined {
        return this._inheritedFrom
            ? this.project?.getReflectionById(this._inheritedFrom) as MethodReflection | undefined
            : undefined;
    }

    set inheritedFrom(value: MethodReflection | undefined) {
        this._inheritedFrom = value?.id;
    }

    /**
     * The method signature which this method is an implementation of.
     * Both {@link inheritedFrom} and {@link implementationOf} may be set, if the reflection
     * this reflection is inherited from is an implementation of some interface.
     */
    get implementationOf(): MethodReflection | undefined {
        return this._implementationOf
            ? this.project?.getReflectionById(this._implementationOf) as MethodReflection | undefined
            : undefined;
    }

    set implementationOf(value: MethodReflection | undefined) {
        this._inheritedFrom = value?.id;
    }

    private _overwrites?: number;
    private _inheritedFrom?: number;
    private _implementationOf?: number;

    serialize(serializer: Serializer, init: BaseSerialized<MethodReflection>): SerializedMethodReflection {
        const result: SerializedMethodReflection = {
            ...init,
            signatures: serializer.toObjects(this.signatures),
        }

        if (typeof this._overwrites === 'number') {
            result.overwrites = this._overwrites;
        }
        if (typeof this._inheritedFrom === 'number') {
            result.inheritedFrom = this._inheritedFrom;
        }
        if (typeof this._implementationOf === 'number') {
            result.implementationOf = this._implementationOf;
        }

        return result;
    }
}

export interface SerializedMethodReflection extends Serialized<MethodReflection, 'signatures'> {
    overwrites?: number;
    inheritedFrom?: number;
    implementationOf?: number;
}

export class SignatureReflection extends Reflection {
    readonly kind = ReflectionKind.Signature;

    /**
     * The function parameters of this signature.
     */
    parameters: ParameterReflection[];

    /**
     * Any type parameters owned by this signature.
     */
    typeParameters: TypeParameterType[];

    /**
     * The return type of this signature.
     */
    returnType: SomeType | ObjectReflection;

    constructor(name: string, returnType: SomeType | ObjectReflection, parameters: ParameterReflection[], typeParameters: TypeParameterType[]) {
        super(name);
        this.returnType = returnType;
        this.parameters = parameters;
        this.typeParameters = typeParameters;
    }

    serialize(serializer: Serializer, init: BaseSerialized<SignatureReflection>): SerializedSignatureReflection {
        return {
            ...init,
            parameters: serializer.toObjects(this.parameters),
            typeParameters: serializer.toObjects(this.typeParameters),
            returnType: serializer.toObject(this.returnType)
        };
    }
}

export interface SerializedSignatureReflection extends Serialized<SignatureReflection, 'parameters' | 'typeParameters' | 'returnType'> {
}
