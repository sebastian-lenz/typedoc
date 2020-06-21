import { Type, TypeKind } from './abstract';
import { wrap, cloned } from './utils';
import { Serializer, BaseSerialized, Serialized } from '../../serialization';
import { SomeType } from '.';

/**
 * Represents an union type.
 *
 * ```ts
 * let value: string | string[];
 * ```
 */
export class UnionType extends Type {
    /** @inheritdoc */
    readonly kind = TypeKind.Union;

    /**
     * The types this union consists of.
     */
    types: SomeType[];

    constructor(types: SomeType[]) {
        super();
        this.types = types;
    }

    /** @inheritdoc */
    clone(): UnionType {
        return new UnionType(cloned(this.types));
    }

    /** @inheritdoc */
    stringify(wrapped: boolean): string {
        return wrap(wrapped, this.types.map(type => type.stringify(true)).join(' | '));
    }

    /** @inheritdoc */
    serialize(serializer: Serializer, init: BaseSerialized<UnionType>): SerializedUnionType {
        return {
            ...init,
            types: serializer.toObjects(this.types)
        };
    }
}

export interface SerializedUnionType extends Serialized<UnionType, 'types'> {
}
