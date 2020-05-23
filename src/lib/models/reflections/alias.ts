import { Reflection, ReflectionKind } from './abstract';
import type { TypeParameterReflection } from './parameter';
import type { SomeType } from '../types';
import { Serialized, Serializer, BaseSerialized } from '../../serialization';

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
    readonly kind = ReflectionKind.TypeAlias;

    typeParameters: TypeParameterReflection[];

    type: SomeType;

    constructor(name: string, type: SomeType, typeParameters: TypeParameterReflection[]) {
        super(name);
        this.type = type;
        this.typeParameters = typeParameters;
    }

    serialize(serializer: Serializer, init: BaseSerialized<TypeAliasReflection>): SerializedTypeAliasReflection {
        return {
            ...init,
            typeParameters: serializer.toObjects(this.typeParameters),
            type: serializer.toObject(this.type)
        }
    }
}

export interface SerializedTypeAliasReflection extends Serialized<TypeAliasReflection, 'typeParameters' | 'type'> {
}
