import type {
  BaseSerialized,
  Serialized,
  Serializer,
} from "../../serialization";
import type { SomeType } from "../types";
import { Reflection, ReflectionKind } from "./abstract";
import { ObjectReflection } from "./object";
import { Visibility } from "./class";

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
  type: SomeType | ObjectReflection;

  /**
   * The access level of this property.
   */
  visibility: Visibility;

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

  constructor(
    name: string,
    type: SomeType | ObjectReflection,
    visibility: Visibility,
    defaultValue?: string
  ) {
    super(name);
    this.type = type;
    this.visibility = visibility;
    this.defaultValue = defaultValue;
  }

  serialize(
    serializer: Serializer,
    init: BaseSerialized<PropertyReflection>
  ): SerializedPropertyReflection {
    const result: SerializedPropertyReflection = {
      ...init,
      type: serializer.toObject(this.type),
      visibility: this.visibility,
    };

    if (typeof this.defaultValue === "string") {
      result.defaultValue = this.defaultValue;
    }

    return result;
  }
}

export interface SerializedPropertyReflection
  extends Serialized<
    PropertyReflection,
    "type" | "visibility" | "defaultValue"
  > {}

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
export class AccessorReflection extends Reflection {
  readonly kind = ReflectionKind.Accessor;

  /**
   * The type of this property.
   */
  type: SomeType | ObjectReflection;

  /**
   * The access level of this property.
   */
  visibility: Visibility;

  /**
   * True if this property has a getter.
   */
  hasGetter: boolean;

  /**
   * True if this property has a setter.
   */
  hasSetter: boolean;

  constructor(
    name: string,
    type: SomeType | ObjectReflection,
    visibility: Visibility,
    hasGetter: boolean,
    hasSetter: boolean
  ) {
    super(name);
    this.type = type;
    this.visibility = visibility;
    this.hasGetter = hasGetter;
    this.hasSetter = hasSetter;
  }

  serialize(
    serializer: Serializer,
    init: BaseSerialized<AccessorReflection>
  ): SerializedDynamicPropertyReflection {
    return {
      ...init,
      visibility: this.visibility,
      hasGetter: this.hasGetter,
      hasSetter: this.hasSetter,
      type: serializer.toObject(this.type),
    };
  }
}

export interface SerializedDynamicPropertyReflection
  extends Serialized<
    AccessorReflection,
    "type" | "visibility" | "hasGetter" | "hasSetter"
  > {}
