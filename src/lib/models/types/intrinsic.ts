import { Type } from './abstract';

/**
 * Represents an intrinsic type like `string` or `boolean`.
 *
 * ```ts
 * let value: number;
 * type A = unknown;
 * ```
 */
export class IntrinsicType extends Type {
    /** @inheritdoc */
    readonly type = 'intrinsic';

    /**
     * The name of the intrinsic type like `string` or `boolean`.
     */
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    /** @inheritdoc */
    clone() {
        return new IntrinsicType(this.name);
    }

    /** @inheritdoc */
    stringify() {
        return this.name;
    }
}
