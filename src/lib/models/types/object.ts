import * as assert from 'assert';
import type { Serializer, BaseSerialized, Serialized } from '../../serialization';
import { Type, TypeKind } from './abstract';
import type { SignatureType, ConstructorType } from './signature';
import { cloned } from './utils';
import { SomeType } from '.';

/**
 * The most versatile type, describes any type of object with properties, methods,
 * signatures, and construct signatures.
 */
export class ObjectType extends Type {
    /** @inheritdoc */
    readonly kind = TypeKind.Object;

    constructor(
        /** Includes methods, like the TS Type. */
        public properties: PropertyType[],
        public signatures: SignatureType[],
        public constructSignatures: ConstructorType[]
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
            return this.constructSignatures[0].stringify(wrapped, true);
        }

        // Fall back to an object display, properties, then signatures, then construct signatures.
        const members = [
            ...this.properties.map(prop => prop.stringify(false)),
            ...this.signatures.map(prop => prop.stringify(false)),
            ...this.constructSignatures.map(prop => prop.stringify(false))
        ];

        return `{ ${members.join('; ')} }`;
    }

    /** @inheritdoc */
    serialize(serializer: Serializer, init: BaseSerialized<ObjectType>): SerializedObjectType {
        return {
            ...init,
            properties: serializer.toObjects(this.properties),
            signatures: serializer.toObjects(this.signatures),
            constructSignatures: serializer.toObjects(this.constructSignatures)
        };
    }
}

export interface SerializedObjectType extends Serialized<ObjectType, 'properties' | 'signatures' | 'constructSignatures'> {
}

export class PropertyType extends Type {
    /** @inheritdoc */
    readonly kind = TypeKind.Property;

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

    /** @inheritdoc */
    serialize(serializer: Serializer, init: BaseSerialized<PropertyType>): SerializedPropertyType {
        return {
            ...init,
            name: this.name,
            isReadonly: this.isReadonly,
            isOptional: this.isOptional,
            propertyType: serializer.toObject(this.propertyType)
        };
    }
}

export interface SerializedPropertyType extends Serialized<PropertyType, 'name' | 'isReadonly' | 'isOptional' | 'propertyType'> {
}
