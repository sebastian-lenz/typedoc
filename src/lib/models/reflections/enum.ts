import { ReflectionKind, ContainerReflection, Reflection } from './abstract';
import { ReflectionFlag } from './flags';
import { Serializer, BaseSerialized, Serialized } from '../../serialization';

/**
 * Describes an enum which may contain enum members. The {@link ReflectionFlag.Const} flag
 * will be set if this reflection describes a const enum.
 *
 * ```ts
 * const enum Enum { <-- Here
 *   a
 * }
 * ```
 */
export class EnumReflection extends ContainerReflection<EnumMemberReflection> {
    readonly kind = ReflectionKind.Enum;

    constructor(name: string, isConst: boolean) {
        super(name);
        if (isConst) {
            this.flags.setFlag(ReflectionFlag.Const, true);
        }
    }

    serialize(_serializer: Serializer, init: BaseSerialized<EnumReflection>): SerializedEnumReflection {
        return init;
    }
}

export interface SerializedEnumReflection extends Serialized<EnumReflection, never> {
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
        }
    }
}

export interface SerializedEnumMemberReflection extends Serialized<EnumMemberReflection, 'value'> {
}
