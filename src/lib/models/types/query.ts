import { Type } from './abstract';
import type { ReferenceType } from './reference';

/**
 * Represents a type that is constructed by querying the type of a reflection.
 * ```ts
 * const x = 1
 * type Z = typeof x // query on reflection for x
 * ```
 */
export class QueryType extends Type {
    /** @inheritdoc */
    readonly type = 'query';

    /**
     * A reference to the reflection whose type is being queried.
     */
    queryType: ReferenceType;

    constructor(reference: ReferenceType) {
        super();
        this.queryType = reference;
    }

    /** @inheritdoc */
    clone() {
        return new QueryType(this.queryType.clone());
    }

    /** @inheritdoc */
    stringify() {
        return `typeof ${this.queryType}`;
    }
}
