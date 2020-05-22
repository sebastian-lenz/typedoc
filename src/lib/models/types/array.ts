import { Type } from './abstract';
import type { SomeType } from '.';

/**
 * Represents an array type.
 *
 * ```ts
 * type A = string[];
 * type B = Array<string>;
 * ```
 */
export class ArrayType extends Type {
    /** @inheritdoc */
    readonly type = 'array';

    /**
     * The type of the array elements.
     */
    elementType: SomeType;

    constructor(elementType: SomeType) {
        super();
        this.elementType = elementType;
    }

    /** @inheritdoc */
    clone() {
        return new ArrayType(this.elementType.clone());
    }

    /** @inheritdoc */
    stringify(wrapped: boolean) {
        return this.elementType.stringify(true) + '[]';
    }
}
