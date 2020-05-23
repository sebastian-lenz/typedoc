import { wrap } from "module";
import { Type, TypeKind } from ".";
import { BaseSerialized, Serialized } from "../../serialization";

/**
 * Represents an inferred type, U in the example below.
 *
 * ```ts
 * type Z = Promise<string> extends Promise<infer U> ? U : never
 * ```
 */
export class InferredType extends Type {
    /** @inheritdoc */
    readonly kind = TypeKind.Inferred;

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

    /** @inheritdoc */
    serialize(_serializer: unknown, init: BaseSerialized<InferredType>): SerializedInferredType {
        return {
            ...init,
            name: this.name
        };
    }
}

export interface SerializedInferredType extends Serialized<InferredType, 'name'> {
}
