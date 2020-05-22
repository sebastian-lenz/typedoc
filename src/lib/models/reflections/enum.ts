import { ReflectionKind, ContainerReflection, Reflection } from './abstract';
import { ReflectionFlag } from './flags';

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
        this.flags.setFlag(ReflectionFlag.Const, isConst);
    }
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
}
