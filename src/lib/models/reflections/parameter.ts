import type { BaseSerialized, Serialized, Serializer } from '../../serialization';
import type { SomeType } from '../types/index';
import { Reflection, ReflectionKind } from './abstract';
import type { ObjectReflection } from './object';

export class ParameterReflection extends Reflection {
    readonly kind = ReflectionKind.Parameter;

    defaultValue?: string;
    isOptional: boolean;
    isRest: boolean;

    /**
     * The parameter type, if there is no type, defaults to `any` to conform to TypeScript's
     * behavior. Turning on `noImplicitAny` is recommended as it can prevent `any` from sneaking
     * in accidentally.
     *
     * Themes may choose to not render the type of a parameter if it is `any`.
     */
    type: SomeType | ObjectReflection;

    constructor(name: string, type: SomeType | ObjectReflection, defaultValue: string | undefined, isOptional: boolean, isRest: boolean) {
        super(name);
        this.type = type;
        this.defaultValue = defaultValue;
        this.isOptional = isOptional;
        this.isRest = isRest;
    }

    serialize(serializer: Serializer, init: BaseSerialized<ParameterReflection>): SerializedParameterReflection {
        const result: SerializedParameterReflection = {
            ...init,
            type: serializer.toObject(this.type)
        };

        if (typeof this.defaultValue === 'string') {
            result.defaultValue = this.defaultValue;
        }

        return result;
    }
}

export interface SerializedParameterReflection extends Serialized<ParameterReflection, 'type' | 'defaultValue'> {
}
