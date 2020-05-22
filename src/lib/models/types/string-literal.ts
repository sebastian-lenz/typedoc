import { Type } from './abstract';

/**
 * Represents a string literal type.
 *
 * ```
 * let value: "DIV";
 * ```
 */
export class StringLiteralType extends Type {
    /** @inheritdoc */
    readonly type = 'stringLiteral';

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
}
