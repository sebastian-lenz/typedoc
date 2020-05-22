import { ReflectionKind, Reflection } from './abstract';
import type { SomeType } from '../types';

/**
 * Describes a property of a {@link ClassReflection} or {@link InterfaceReflection}.
 *
 * The reflection flags may mark this property's visibility and modifiers.
 *
 * ```ts
 * interface Interface {
 *   a: number <-- Here
 * }
 * ```
 */
export class PropertyReflection extends Reflection {
    readonly kind = ReflectionKind.Property;

    /**
     * The type of this property.
     */
    type: SomeType;

    /**
     * If the property has an initializer, that initializer as a string.
     *
     * For the `bar` property of the following class, this would be set to `'bar'`.
     * ```ts
     * class Foo {
     *   bar = 'bar';
     * }
     * ```
     */
    defaultValue?: string;

    constructor(name: string, type: SomeType, defaultValue?: string) {
        super(name);
        this.type = type;
        this.defaultValue = defaultValue;
    }
}

/**
 * Describes a dynamic getter or setter property of a {@link ClassReflection}
 *
 * Note that it is possible for a dynamic property to have a setter without a getter.
 * This is likely a mistake and is treated as an error by API Extractor, but TypeDoc is
 * not a linter, this can be checked with ESLint's
 * {@link https://eslint.org/docs/rules/accessor-pairs | accessor-pairs} rule.
 *
 * Like API Extractor, TypeDoc treats getter/setter pairs as a single item in the
 * documentation. However, TypeDoc supports excluding members from the documentation
 * by including tags within the documentation comment. This means that doc comments on
 * the setter must be considered when creating this reflection. See the {@link CommentPlugin}
 * for the implementation details.
 *
 * ```ts
 * class Class {
 *   get foo(): number <-- Here
 * }
 * ```
 */
export class DynamicPropertyReflection extends Reflection {
    readonly kind = ReflectionKind.DynamicProperty;

    /**
     * The type of this property.
     */
    type: SomeType;

    /**
     * True if this property has a getter.
     */
    hasGetter: boolean;

    /**
     * True if this property has a setter.
     */
    hasSetter: boolean;

    constructor(name: string, type: SomeType, hasGetter: boolean, hasSetter: boolean) {
        super(name);
        this.type = type;
        this.hasGetter = hasGetter;
        this.hasSetter = hasSetter;
    }
}
