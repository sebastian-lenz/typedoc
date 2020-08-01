import type {
  Serializer,
  BaseSerialized,
  Serialized,
} from "../../serialization";
import { Type, TypeKind } from "./abstract";
import type { TypeParameterType } from "./type-parameter";
import type { SomeType } from ".";

export enum OptionalModifier {
  None = "none",
  Add = "add",
  Remove = "remove",
}

/**
 * Represents an intrinsic type like `string` or `boolean`.
 *
 * ```ts
 * let value: number;
 * type A = unknown;
 * ```
 */
export class MappedType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.Mapped;

  /**
   * Represents the name of the mapped type.
   *
   * ```
   * { [K in keyof T]: string }
   *    ^^^^^^^^^^^^
   * ```
   *
   * Note that the constraint of the parameter in this case is `keyof T`
   */
  parameter: TypeParameterType & { constraint: SomeType };

  /**
   * Represents the type that is being mapped to.
   *
   * ```
   * { [K in keyof T]: string }
   *                   ^^^^^^
   * ```
   */
  type: SomeType;

  /**
   * How optionality is modified by this mapped type.
   *
   * ```
   * { [K in keyof T]-?: string }
   *                 ^^
   * ```
   */
  optionalModifier: OptionalModifier;

  /**
   * How readonly properties are modified by this type.
   *
   * ```
   * { readonly [K in keyof T]: string }
   *   ^^^^^^^^
   * ```
   */
  readonlyModifier: OptionalModifier;

  constructor(
    readonlyModifier: OptionalModifier,
    parameter: TypeParameterType & { constraint: SomeType },
    optionalityModifier: OptionalModifier,
    type: SomeType
  ) {
    super();
    this.readonlyModifier = readonlyModifier;
    this.parameter = parameter;
    this.optionalModifier = optionalityModifier;
    this.type = type;
  }

  /** @inheritdoc */
  clone(): MappedType {
    return new MappedType(
      this.readonlyModifier,
      this.parameter.clone() as TypeParameterType & { constraint: SomeType }, // already validated
      this.optionalModifier,
      this.type.clone()
    );
  }

  /** @inheritdoc */
  stringify(): string {
    const prefix = {
      [OptionalModifier.None]: " ",
      [OptionalModifier.Add]: " readonly ",
      [OptionalModifier.Remove]: " -readonly ",
    }[this.readonlyModifier];

    const parameter =
      this.parameter.name + " in " + this.parameter.constraint.toString();

    const sep = {
      [OptionalModifier.None]: ": ",
      [OptionalModifier.Add]: "?: ",
      [OptionalModifier.Remove]: "-?: ",
    }[this.optionalModifier];

    return `{${prefix}[${parameter}]${sep}${this.type.toString()} }`;
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<MappedType>
  ): SerializedMappedType {
    return {
      ...init,
      readonlyModifier: this.readonlyModifier,
      parameter: serializer.toObject(this.parameter),
      optionalModifier: this.optionalModifier,
      type: serializer.toObject(this.type),
    };
  }
}

export interface SerializedMappedType
  extends Serialized<
    MappedType,
    "readonlyModifier" | "parameter" | "optionalModifier" | "type"
  > {}
