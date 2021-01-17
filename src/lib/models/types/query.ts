import { Type } from "./abstract";
import type { ReferenceType } from "./reference";

/**
 * Represents a type that is constructed by querying the type of a reflection.
 * ```ts
 * const x = 1
 * type Z = typeof x // query on reflection for x
 * ```
 */
export class QueryType extends Type {
    readonly queryType: ReferenceType;

    readonly type = "query";

    constructor(reference: ReferenceType) {
        super();
        this.queryType = reference;
    }

    clone(): Type {
        return new QueryType(this.queryType);
    }

    equals(other: Type): boolean {
        return (
            other instanceof QueryType && this.queryType.equals(other.queryType)
        );
    }

    toString() {
        return `typeof ${this.queryType.toString()}`;
    }
}
