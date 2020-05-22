import * as assert from 'assert';
import { Type } from './abstract';
import type { SomeType } from '.';

/**
 * Represents a type predicate.
 *
 * Note that this type is only valid in the return types of functions.
 *
 * ```ts
 * function isString(anything: any): anything is string {}
 * function assert(condition: boolean): asserts condition {}
 * ```
 */
export class PredicateType extends Type {
    /** @inheritdoc */
    readonly type = 'predicate';

    /**
     * The type that the identifier is tested to be.
     * May be undefined if the type is of the form `asserts val`.
     * Will be defined if the type is of the form `asserts val is string` or `val is string`.
     */
    targetType?: SomeType;

    /**
     * The identifier name which is tested by the predicate.
     */
    name: string;

    /**
     * True if the type is of the form `asserts val is string`, false if
     * the type is of the form `val is string`
     */
    asserts: boolean;

    constructor(name: string, asserts: boolean, targetType?: SomeType) {
        super();
        this.name = name;
        this.asserts = asserts;
        this.targetType = targetType;
    }

    /** @inheritdoc */
    clone() {
        return new PredicateType(this.name, this.asserts, this.targetType?.clone());
    }

    /** @inheritdoc */
    stringify(wrapped: boolean) {
        assert(wrapped === false, 'Predicate types cannot be wrapped within other types.');

        const out = this.asserts ? ['asserts', this.name] : [this.name];
        if (this.targetType) {
            out.push('is', this.targetType.toString());
        }

        return out.join(' ');
    }
}
