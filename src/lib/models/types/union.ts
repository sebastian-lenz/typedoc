import { Type } from './abstract';
import type { SomeType } from './index';
import { wrap, cloned } from './utils';

/**
 * Represents an union type.
 *
 * ```ts
 * let value: string | string[];
 * ```
 */
export class UnionType extends Type {
    /** @inheritdoc */
    readonly type = 'union';

    /**
     * The types this union consists of.
     */
    types: SomeType[];

    constructor(types: SomeType[]) {
        super();
        this.types = types;
    }

    /** @inheritdoc */
    clone() {
        return new UnionType(cloned(this.types));
    }

    /** @inheritdoc */
    stringify(wrapped: boolean) {
        return wrap(wrapped, this.types.map(type => type.stringify(true)).join(' | '));
    }
}
