import * as assert from "assert";
import type {
  BaseSerialized,
  Serialized,
  Serializer,
} from "../../serialization";
import { Type, TypeKind } from "./abstract";
import type { SomeType } from "./index";
import type { TypeParameterType } from "./type-parameter";
import { cloned, wrap } from "./utils";

/**
 * Type which describes a signature.
 *
 * ```ts
 * type T = () => string
 * type U = <A>(arg: A) => A
 * ```
 */
export class SignatureType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.Signature;

  constructor(
    public typeParameters: TypeParameterType[],
    public parameters: SignatureParameterType[],
    public returnType: SomeType
  ) {
    super();
  }

  /** @inheritdoc */
  clone(): SignatureType {
    return new SignatureType(
      cloned(this.typeParameters),
      cloned(this.parameters),
      this.returnType.clone()
    );
  }

  /** @inheritdoc */
  stringify(wrapped: boolean, useArrow = false): string {
    const typeParameters = this.typeParameters.map(String).join(", ");
    const parameters = this.parameters.map(String).join(", ");
    const returnIndicator = useArrow ? ": " : " => ";
    return wrap(
      wrapped,
      (typeParameters ? `<${typeParameters}>` : "") +
        `(${parameters})${returnIndicator}${this.returnType}`
    );
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<SignatureType>
  ): SerializedSignatureType {
    return {
      ...init,
      typeParameters: serializer.toObjects(this.typeParameters),
      parameters: serializer.toObjects(this.parameters),
      returnType: serializer.toObject(this.returnType),
    };
  }
}

export interface SerializedSignatureType
  extends Serialized<
    SignatureType,
    "typeParameters" | "parameters" | "returnType"
  > {}

/**
 * Type which describes a construct signature.
 *
 * ```ts
 * type T = new () => string
 * type U = new <A extends new () => String>(arg: A) => String
 * ```
 */
export class ConstructorType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.Constructor;

  constructor(
    public typeParameters: TypeParameterType[],
    public parameters: SignatureParameterType[],
    public returnType: SomeType
  ) {
    super();
  }

  /** @inheritdoc */
  clone(): ConstructorType {
    return new ConstructorType(
      cloned(this.typeParameters),
      cloned(this.parameters),
      this.returnType.clone()
    );
  }

  /** @inheritdoc */
  stringify(wrapped: boolean, useArrow = false): string {
    const typeParameters = this.typeParameters.map(String).join(", ");
    const parameters = this.parameters.map(String).join(", ");
    const returnIndicator = useArrow ? ": " : " => ";
    return wrap(
      wrapped,
      "new " +
        (typeParameters ? `<${typeParameters}>` : "") +
        `(${parameters})${returnIndicator}${this.returnType}`
    );
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<ConstructorType>
  ): SerializedConstructorType {
    return {
      ...init,
      typeParameters: serializer.toObjects(this.typeParameters),
      parameters: serializer.toObjects(this.parameters),
      returnType: serializer.toObject(this.returnType),
    };
  }
}

export interface SerializedConstructorType
  extends Serialized<
    ConstructorType,
    "typeParameters" | "parameters" | "returnType"
  > {}

/**
 * Type which describes a parameter of a signature.
 */
export class SignatureParameterType extends Type {
  /** @inheritdoc */
  readonly kind = TypeKind.SignatureParameter;

  constructor(
    public name: string,
    public isOptional: boolean,
    public isRest: boolean,
    public parameterType: SomeType
  ) {
    super();
  }

  /** @inheritdoc */
  clone(): SignatureParameterType {
    return new SignatureParameterType(
      this.name,
      this.isOptional,
      this.isRest,
      this.parameterType.clone()
    );
  }

  /** @inheritdoc */
  stringify(wrapped: boolean): string {
    assert(
      wrapped === false,
      "SignatureParameterTypes may not be contained within other types."
    );

    return (
      (this.isRest ? "..." : "") +
      this.name +
      (this.isOptional ? "?" : "") +
      ": " +
      this.parameterType
    );
  }

  /** @inheritdoc */
  serialize(
    serializer: Serializer,
    init: BaseSerialized<SignatureParameterType>
  ): SerializedSignatureParameterType {
    return {
      ...init,
      name: this.name,
      isOptional: this.isOptional,
      isRest: this.isRest,
      parameterType: serializer.toObject(this.parameterType),
    };
  }
}

export interface SerializedSignatureParameterType
  extends Serialized<
    SignatureParameterType,
    "name" | "isOptional" | "isRest" | "parameterType"
  > {}
