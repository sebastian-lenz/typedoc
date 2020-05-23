import { Type, TypeKind } from './abstract';
import { BaseSerialized, Serialized } from '../../serialization';

/**
 * Represents a string literal type.
 *
 * ```
 * let value: "DIV";
 * ```
 */
export class StringLiteralType extends Type {
    /** @inheritdoc */
    readonly kind = TypeKind.StringLiteral;

    /**
     * The string literal value.
     */
    value: string;

    constructor(value: string) {
        super();
        this.value = value;
    }

    /** @inheritdoc */
    clone() {
        return new StringLiteralType(this.value);
    }

    /** @inheritdoc */
    stringify(): string {
        return JSON.stringify(this.value);
    }

    /** @inheritdoc */
    serialize(serializer: unknown, init: BaseSerialized<StringLiteralType>): SerializedStringLiteralType {
        return {
            ...init,
            value: this.value
        };
    }
}

export interface SerializedStringLiteralType extends Serialized<StringLiteralType, 'value'> {
}
