import type * as ts from "typescript";
import type { ProjectReflection } from "../reflections";
import { Reflection } from "../reflections/abstract";
import { Type } from "./abstract";

/**
 * Represents a type that refers to another reflection like a class, interface or enum.
 *
 * ~~~
 * let value: MyClass;
 * ~~~
 */
export class ReferenceType extends Type {
    /**
     * The type name identifier.
     */
    readonly type = "reference";

    /**
     * The name of the referenced type.
     *
     * If the symbol cannot be found cause it's not part of the documentation this
     * can be used to represent the type.
     */
    name: string;

    /**
     * The type arguments of this reference.
     */
    typeArguments?: Type[];

    /**
     * The resolved reflection.
     */
    get reflection() {
        if (typeof this._target === "number") {
            return this._project.getReflectionById(this._target);
        }
        const resolved = this._project.getReflectionFromSymbol(this._target);
        if (resolved) this._target = resolved.id;
        return resolved;
    }

    /**
     * Horrible hacky solution to get around Handlebars messing with `this` in bad ways.
     * Don't use this if possible, it will go away once we use something besides handlebars for themes.
     */
    getReflection = () => this.reflection;

    private _target: ts.Symbol | number;
    private _project: ProjectReflection;

    /**
     * Create a new instance of ReferenceType.
     */
    constructor(
        name: string,
        target: ts.Symbol | Reflection | number,
        project: ProjectReflection
    ) {
        super();
        this.name = name;
        this._target = target instanceof Reflection ? target.id : target;
        this._project = project;
    }

    /** @internal this is used for type parameters, which don't actually point to something */
    static createBrokenReference(name: string, project: ProjectReflection) {
        return new ReferenceType(name, -1, project);
    }

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    clone(): Type {
        const clone = new ReferenceType(this.name, this._target, this._project);
        clone.typeArguments = this.typeArguments;
        return clone;
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param other  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(other: ReferenceType): boolean {
        if (other instanceof ReferenceType) {
            if (this.reflection != null) {
                return this.reflection === other.reflection;
            }
            return this._target === other._target;
        }
        return false;
    }

    /**
     * Return a string representation of this type.
     * @example EventEmitter<any>
     */
    toString() {
        const name = this.reflection ? this.reflection.name : this.name;
        let typeArgs = "";

        if (this.typeArguments && this.typeArguments.length > 0) {
            typeArgs += "<";
            typeArgs += this.typeArguments
                .map((arg) => arg.toString())
                .join(", ");
            typeArgs += ">";
        }

        return name + typeArgs;
    }
}
