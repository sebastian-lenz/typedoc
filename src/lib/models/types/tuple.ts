import { Type, TypeKind } from './abstract';
import { cloned } from './utils';
import { Serializer, BaseSerialized, Serialized } from '../../serialization';
import { SomeType } from '.';

/**
 * Represents a tuple type.
 *
 * ```ts
 * let value: [string, boolean];
 * ```
 */
export class TupleType extends Type {
    /** @inheritdoc */
    readonly kind = TypeKind.Tuple;

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

    /** @inheritdoc */
    serialize(serializer: Serializer, init: BaseSerialized<TupleType>): SerializedTupleType {
        return {
            ...init,
            elements: serializer.toObjects(this.elements)
        }
    }
}

export interface SerializedTupleType extends Serialized<TupleType, 'elements'> {
}
