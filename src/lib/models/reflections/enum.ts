import { ReflectionKind, ContainerReflection, Reflection } from './abstract';
import { Serializer, BaseSerialized, Serialized } from '../../serialization';

/**
 * Describes an enum which may contain enum members.
 *
 * ```ts
 * const enum Enum { <-- Here
 *   a
 * }
 * ```
 */
export class EnumReflection extends ContainerReflection<EnumMemberReflection> {
    readonly kind = ReflectionKind.Enum;

    isConst: boolean;

    constructor(name: string, isConst: boolean) {
        super(name);
        this.isConst = isConst;
    }

    serialize(_serializer: Serializer, init: BaseSerialized<EnumReflection>): SerializedEnumReflection {
        return {
            ...init,
            isConst: this.isConst
        };
    }
}

export interface SerializedEnumReflection extends Serialized<EnumReflection, 'isConst'> {
}

/**
 * Describes an enum member. Members may have either a string or
 * number value.
 *
 * ```ts
 * enum Enum {
 *   a, // <-- Here
 *   b = "val" // <-- Here
 * }
 * ```
 */
export class EnumMemberReflection extends Reflection {
    readonly kind = ReflectionKind.EnumMember;

    value: string | number;

    constructor(name: string, value: string | number) {
        super(name);
        this.value = value;
    }

    serialize(_serializer: Serializer, init: BaseSerialized<EnumMemberReflection>): SerializedEnumMemberReflection {
        return {
            ...init,
            value: this.value
        };
    }
}

export interface SerializedEnumMemberReflection extends Serialized<EnumMemberReflection, 'value'> {
}
