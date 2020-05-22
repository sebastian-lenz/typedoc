import * as assert from 'assert';
import { Type } from './abstract';
import type { SomeType } from './index';
import type { SignatureType } from './signature';
import { cloned, wrap } from './utils';

/**
 * The most versatile type, describes any type of object with properties, methods,
 * signatures, and construct signatures.
 */
export class ObjectType extends Type {
    /** @inheritdoc */
    readonly type = 'object';

    constructor(
        /** Includes methods, like the TS Type. */
        public properties: PropertyType[],
        public signatures: SignatureType[],
        public constructSignatures: SignatureType[]
    ) {
        super();
    }

    /** @inheritdoc */
    clone() {
        return new ObjectType(cloned(this.properties), cloned(this.signatures), cloned(this.constructSignatures));
    }

    /** @inheritdoc */
    stringify(wrapped: boolean): string {
        // Try to display in a nice way.
        if (!this.properties.length && !this.constructSignatures.length && this.signatures.length === 1) {
            // Single signature, display as arrow: (params) => type
            return this.signatures[0].stringify(wrapped, true);
        }

        if (!this.properties.length && !this.signatures.length && this.constructSignatures.length === 1) {
            // Single construct signature, display as arrow: new (params) => type
            return wrap(wrapped, `new ${this.constructSignatures[0].stringify(false, true)}`);
        }

        // Fall back to an object display, properties, then signatures, then construct signatures.
        const members = [
            ...this.properties.map(prop => prop.stringify(false)),
            ...this.signatures.map(prop => prop.stringify(false)),
            ...this.constructSignatures.map(prop => `new ${prop.stringify(false)}`)
        ];

        return `{ ${members.join('; ')} }`;
    }
}

export class PropertyType extends Type {
    /** @inheritdoc */
    readonly type = 'property';

    constructor(
        public name: string,
        public isReadonly: boolean,
        public isOptional: boolean,
        public propertyType: SomeType
    ) {
        super();
    }

    /** @inheritdoc */
    clone() {
        return new PropertyType(this.name, this.isReadonly, this.isOptional, this.propertyType.clone());
    }

    /** @inheritdoc */
    stringify(wrapped: boolean): string {
        assert(wrapped === false, 'Property types are not considered wrapped when included in an object.');
        const frontModifier = this.isReadonly ? 'readonly ' : '';
        const tailModifier = this.isOptional ? '?' : '';
        return `${frontModifier}${this.name}${tailModifier}: ${this.propertyType}`;
    }
}
