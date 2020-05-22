import { Type } from './abstract';
import type { SomeType } from './index';

/**
 * Represents an indexed access type.
 */
export class IndexedAccessType extends Type {
    /** @inheritdoc */
    readonly type = 'indexedAccess';

    constructor(public objectType: SomeType, public indexType: SomeType) {
        super();
    }

    /** @inheritdoc */
    clone() {
        return new IndexedAccessType(this.objectType.clone(), this.indexType.clone());
    }

    /** @inheritdoc */
    stringify() {
        // The index type is contained within brackets and does not need parenthesis, even if complex.
        return `${this.objectType.stringify(true)}[${this.indexType.stringify(false)}]`;
    }
}
