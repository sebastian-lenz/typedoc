import { Type } from './abstract';
import type { SomeType } from './index';

/**
 * Represents a type operator type.
 *
 * ```ts
 * class A {}
 * class B<T extends keyof A> {}
 * ```
 */
export class TypeOperatorType extends Type {
    /** @inheritdoc */
    readonly type = 'typeOperator';

    constructor(
        public target: SomeType,
        public operator: 'keyof' | 'unique' | 'readonly'
    ) {
        super();
    }

    /** @inheritdoc */
    clone() {
        return new TypeOperatorType(this.target.clone(), this.operator);
    }

    /** @inheritdoc */
    stringify() {
        return `${this.operator} ${this.target.stringify(false)}`;
    }
}
