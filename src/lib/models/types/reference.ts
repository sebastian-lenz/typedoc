import * as ts from 'typescript';
import type { SomeType } from '.';
import type { ProjectReflection } from '../reflections';
import { Reflection, ReflectionKind } from '../reflections/abstract';
import { Type, TypeKind } from './abstract';
import { cloned } from './utils';
import { Serializer, BaseSerialized, Serialized } from '../../serialization';

const TYPE_CONTRIBUTING_KINDS = ReflectionKind.Interface
    | ReflectionKind.Class
    | ReflectionKind.Enum
    | ReflectionKind.TypeAlias
    | ReflectionKind.Module;

/**
 * Represents a type that refers to another reflection like a class, interface or enum.
 *
 * ```ts
 * let value: MyClass;
 * ```
 */
export class ReferenceType extends Type {
    /** @inheritdoc */
    readonly kind = TypeKind.Reference;

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
    typeArguments: SomeType[];

    /**
     * The resolved reflection, if it exists.
     */
    get reflection(): Reflection | undefined {
        if (typeof this._reference === 'number') {
            return this._project.getReflectionById(this._reference);
        }
        for (const reflection of this._project.getReflectionsFromSymbol(this._reference)) {
            if (this._preferValueSpace !== reflection.kindOf(TYPE_CONTRIBUTING_KINDS)) {
                this._reference = reflection.id;
                return reflection;
            }
        }
        for (const reflection of this._project.getReflectionsFromSymbol(this._reference)) {
            this._reference = reflection.id;
            return reflection;
        }
    }

    private _reference: ts.Symbol | number;
    private _project: ProjectReflection;
    private _preferValueSpace: boolean;

    constructor(
        name: string,
        typeArguments: SomeType[],
        reference: ts.Symbol | Reflection | number,
        preferValueSpace: boolean,
        project: ProjectReflection) {

        super();
        this.name = name;
        this.typeArguments = typeArguments;
        this._reference = reference instanceof Reflection ? reference.id : reference;
        this._preferValueSpace = preferValueSpace;
        this._project = project;
    }

    /** @inheritdoc */
    clone() {
        return new ReferenceType(
            this.name,
            cloned(this.typeArguments),
            this._reference,
            this._preferValueSpace,
            this._project);
    }

    /** @inheritdoc */
    stringify() {
        const name = this.reflection?.name ?? this.name;
        let typeArgs = '';
        if (this.typeArguments.length) {
            typeArgs = `<${this.typeArguments.map(arg => arg.toString()).join(', ')}>`;
        }

        return name + typeArgs;
    }

    /** @inheritdoc */
    serialize(serializer: Serializer, init: BaseSerialized<ReferenceType>): SerializedReferenceType {
        const result: SerializedReferenceType = {
            ...init,
            name: this.name,
            typeArguments: serializer.toObjects(this.typeArguments),
        };

        if (this.reflection) {
            result.target = this.reflection.id;
        }

        return result;
    }
}

export interface SerializedReferenceType extends Serialized<ReferenceType, 'name' | 'typeArguments'> {
    target?: number;
}
