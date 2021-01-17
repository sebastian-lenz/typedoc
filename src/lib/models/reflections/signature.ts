import { Type, ReflectionType } from "../types/index";
import {
    Reflection,
    TypeContainer,
    TypeParameterContainer,
    TraverseProperty,
    TraverseCallback,
} from "./abstract";
import type { ContainerReflection } from "./container";
import type { ParameterReflection } from "./parameter";
import type { TypeParameterReflection } from "./type-parameter";

export class SignatureReflection
    extends Reflection
    implements TypeContainer, TypeParameterContainer {
    parent?: ContainerReflection;

    parameters?: ParameterReflection[];

    typeParameters?: TypeParameterReflection[];

    type?: Type;

    /**
     * A type that points to the reflection that has been overwritten by this reflection.
     *
     * Applies to interface and class members.
     */
    overwrites?: Type;

    /**
     * A type that points to the reflection this reflection has been inherited from.
     *
     * Applies to interface and class members.
     */
    inheritedFrom?: Type;

    /**
     * A type that points to the reflection this reflection is the implementation of.
     *
     * Applies to class members.
     */
    implementationOf?: Type;

    /**
     * Return an array of the parameter types.
     */
    getParameterTypes(): Type[] {
        if (!this.parameters) {
            return [];
        }
        function notUndefined<T>(t: T | undefined): t is T {
            return !!t;
        }
        return this.parameters
            .map((parameter) => parameter.type)
            .filter(notUndefined);
    }

    /**
     * Traverse all potential child reflections of this reflection.
     *
     * The given callback will be invoked for all children, signatures and type parameters
     * attached to this reflection.
     *
     * @param callback  The callback function that should be applied for each child reflection.
     */
    traverse(callback: TraverseCallback) {
        if (this.type instanceof ReflectionType) {
            if (
                callback(
                    this.type.declaration,
                    TraverseProperty.TypeLiteral
                ) === false
            ) {
                return;
            }
        }

        for (const parameter of this.typeParameters ?? []) {
            if (callback(parameter, TraverseProperty.TypeParameter) === false) {
                return;
            }
        }

        for (const parameter of this.parameters ?? []) {
            if (callback(parameter, TraverseProperty.Parameters) === false) {
                return;
            }
        }

        super.traverse(callback);
    }

    /**
     * Return a string representation of this reflection.
     */
    toString(): string {
        let result = super.toString();

        if (this.typeParameters) {
            const parameters: string[] = [];
            this.typeParameters.forEach((parameter) =>
                parameters.push(parameter.name)
            );
            result += "<" + parameters.join(", ") + ">";
        }

        if (this.type) {
            result += ":" + this.type.toString();
        }

        return result;
    }
}
