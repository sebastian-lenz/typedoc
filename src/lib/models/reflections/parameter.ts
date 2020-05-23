import type { BaseSerialized, Serialized, Serializer } from '../../serialization';
import type { SomeType } from '../types/index';
import { Reflection, ReflectionKind } from './abstract';

export class ParameterReflection extends Reflection {
    readonly kind = ReflectionKind.Parameter;

    defaultValue?: string;

    /**
     * The parameter type, if there is no type, defaults to `any` to conform to TypeScript's
     * behavior. Turning on `noImplicitAny` is recommended as it can prevent `any` from sneaking
     * in accidentally.
     *
     * Themes may choose to not render the type of a parameter if it is `any`.
     */
    type: SomeType;

    constructor(name: string, type: SomeType, defaultValue?: string) {
        super(name);
        this.type = type;
        this.defaultValue = defaultValue;
    }

    serialize(serializer: Serializer, init: BaseSerialized<ParameterReflection>): SerializedParameterReflection {
        const result: SerializedParameterReflection = {
            ...init,
            type: serializer.toObject(this.type),
        }

        if (typeof this.defaultValue === 'string') {
            result.defaultValue = this.defaultValue;
        }

        return result;
    }
}

export interface SerializedParameterReflection extends Serialized<ParameterReflection, 'type' | 'defaultValue'> {
}
