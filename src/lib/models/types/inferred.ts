import { Type } from './abstract';

/**
 * Represents an inferred type, U in the example below.
 *
 * ```ts
 * type Z = Promise<string> extends Promise<infer U> : never
 * ```
 */
export class InferredType extends Type {
    /**
     * The type name identifier.
     */
    readonly type: string = 'inferred';

    constructor(public name: string) {
        super();
    }

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    clone(): Type {
        return new InferredType(this.name);
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: unknown): boolean {
        if (!(type instanceof InferredType)) {
            return false;
        }
        return this.name === type.name;
    }
}
