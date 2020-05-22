import * as assert from 'assert';
import { Type } from './abstract';
import type { SomeType } from '.';

/**
 * Represents a type parameter type.
 *
 * ```ts
 * function test<T extends string = 'bar'>() {
 *   // here     ^^^^^^^^^^^^^^^^^^^^^^^^
 *   let value: T;
 *   // but not ^ this is a reference
 * }
 * ```
 */
export class TypeParameterType extends Type {
    /** @inheritdoc */
    readonly type = 'typeParameter';

    constructor(
        public name: string,
        public constraint?: SomeType,
        public defaultValue?: SomeType) {

        super();
        this.name = name;
        this.constraint = constraint;
        this.defaultValue = defaultValue;
    }

    /** @inheritdoc */
    clone() {
        return new TypeParameterType(this.name, this.constraint?.clone(), this.defaultValue?.clone());
    }

    /** @inheritdoc */
    stringify(wrapped) {
        assert(wrapped === false, 'Type parameters should never be wrapped in another type.');
        const extendsClause = this.constraint ? ` extends ${this.constraint}` : '';
        const defaultClause = this.defaultValue ? ` = ${this.defaultValue}` : '';
        return this.name + extendsClause + defaultClause;
    }
}
