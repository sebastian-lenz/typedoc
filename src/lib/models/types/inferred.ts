import { Type } from './abstract';
import { wrap } from './utils';

/**
 * Represents an inferred type, U in the example below.
 *
 * ```ts
 * type Z = Promise<string> extends Promise<infer U> ? U : never
 * ```
 */
export class InferredType extends Type {
    /** @inheritdoc */
    readonly type = 'inferred';

    constructor(public name: string) {
        super();
    }

    /** @inheritdoc */
    clone() {
        return new InferredType(this.name);
    }

    /** @inheritdoc */
    stringify(wrapped: boolean) {
        return wrap(wrapped, `infer ${this.name}`);
    }
}
