import type { Serializer, BaseSerialized, Serialized } from '../../serialization';
import { Type, TypeKind } from './abstract';

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
    readonly kind = TypeKind.Intrinsic;

    /**
     * The name of the intrinsic type like `string` or `boolean`.
     */
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    /** @inheritdoc */
    clone(): IntrinsicType {
        return new IntrinsicType(this.name);
    }

    /** @inheritdoc */
    stringify(): string {
        return this.name;
    }

    /** @inheritdoc */
    serialize(_serializer: Serializer, init: BaseSerialized<IntrinsicType>): SerializedIntrinsicType {
        return {
            ...init,
            name: this.name
        };
    }
}

export interface SerializedIntrinsicType extends Serialized<IntrinsicType, 'name'> {
}
