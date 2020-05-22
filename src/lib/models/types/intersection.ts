import { Type } from './abstract';
import { wrap, cloned } from './utils';
import type { SomeType } from './index';

/**
 * Represents an intersection type.
 *
 * ```ts
 * let value: A & B;
 * ```
 */
export class IntersectionType extends Type {
    /** @inheritdoc */
    readonly type = 'intersection';

    /**
     * The types this intersection consists of.
     */
    types: SomeType[];

    constructor(types: SomeType[]) {
        super();
        this.types = types;
    }

    /** @inheritdoc */
    clone() {
        return new IntersectionType(cloned(this.types));
    }

    /** @inheritdoc */
    stringify(wrapped: boolean) {
        return wrap(wrapped, this.types.map(type => type.stringify(true)).join(' & '));
    }
}
