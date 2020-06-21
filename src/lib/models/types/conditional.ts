import type { SomeType } from '.';
import type { Serializer, BaseSerialized, Serialized } from '../../serialization';
import { Type, TypeKind } from './abstract';
import { wrap } from './utils';

/**
 * Represents a conditional type.
 *
 * ```ts
 * let value: C extends E ? T : F;
 * let value2: Check extends Extends ? True : False;
 * ```
 */
export class ConditionalType extends Type {
    readonly kind = TypeKind.Conditional;

    constructor(
        public checkType: SomeType,
        public extendsType: SomeType,
        public trueType: SomeType,
        public falseType: SomeType
    ) {
        super();
    }

    /** @inheritdoc */
    clone(): ConditionalType {
        return new ConditionalType(
            this.checkType.clone(),
            this.extendsType.clone(),
            this.trueType.clone(),
            this.falseType.clone());
    }

    /** @inheritdoc */
    stringify(wrapped: boolean): string {
        return wrap(wrapped, `${
            this.checkType.stringify(true)
        } extends ${
            this.extendsType.stringify(true)
        } ? ${
            this.trueType.stringify(true)
        } : ${
            this.falseType.stringify(true)
        }`);
    }

    /** @inheritdoc */
    serialize(serializer: Serializer, init: BaseSerialized<ConditionalType>): SerializedConditionalType {
        return {
            ...init,
            checkType: serializer.toObject(this.checkType),
            extendsType: serializer.toObject(this.extendsType),
            trueType: serializer.toObject(this.trueType),
            falseType: serializer.toObject(this.falseType)
        };
    }
}

export interface SerializedConditionalType extends Serialized<ConditionalType,
    'checkType' | 'extendsType' | 'trueType' | 'falseType'> {
}
