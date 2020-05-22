import { Type } from './abstract';
import type { SomeType } from './index';
import { cloned } from './utils';

/**
 * Represents a tuple type.
 *
 * ```ts
 * let value: [string, boolean];
 * ```
 */
export class TupleType extends Type {
    /** @inheritdoc */
    readonly type = 'tuple';

    /**
     * The ordered type elements of the tuple type.
     */
    elements: SomeType[];

    constructor(elements: SomeType[]) {
        super();
        this.elements = elements;
    }

    /** @inheritdoc */
    clone() {
        return new TupleType(cloned(this.elements));
    }

    /** @inheritdoc */
    stringify() {
        // No need for parenthesis here, each element is distinguishable and the whole type
        // is wrapped with brackets.
        return `[${this.elements.map(type => type.stringify(false)).join(', ')}]`;
    }
}
