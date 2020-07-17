/**
 * Contains converters for `ts.Type`s. These will frequently be near copies of the
 * converters defined in type-nodes.ts. They are necessary because we won't always have
 * type nodes since TypeScript can frequently infer types:
 * ```ts
 * function foo() { return 1; }
 * function bar({ a = 1, c = '' }) { return c.repeat(a); }
 * ```
 *
 * Whenever possible we try to convert types from their type nodes instead. This is desirable
 * because some type aliases are interned and once we only have a ts.Type, there is no way to
 * tell if the type should be converted to the intrinsic type or some user defined alias to
 * the type.
 *
 * @packageDocumentation
 */

import * as ts from "typescript";
import * as M from "../models";
import type { Converter } from "./converter";
import { hasReadonlyModifier } from "./utils";

export interface TypeConverter<
  T extends ts.Type = ts.Type,
  O extends M.SomeType = M.SomeType
> {
  order?: number;
  // Unfortunately there's no way to be O(1) here. Types can have multiple flags and don't have a `kind` property.
  supports(type: ts.Type, checker: ts.TypeChecker): boolean;
  convert(converter: Converter, type: T, checker: ts.TypeChecker): O;
}

export function addTypeConverters(converter: Converter) {
  for (const typeConverter of [
    anyTypeConverter,
    arrayTypeConverter,
    booleanTypeConverter,
    conditionalConverter,
    literalTypeConverter,
    numberTypeConverter,
    objectTypeConverter,
    referenceTypeConverter,
    stringTypeConverter,
    tupleTypeConverter,
    typeParameterConverter,
    unionOrIntersectionConverter,
    voidTypeConverter,
  ]) {
    converter.addTypeConverter(typeConverter);
  }
}

const anyTypeConverter: TypeConverter<ts.Type, M.IntrinsicType> = {
  supports(type) {
    return Boolean(type.flags & ts.TypeFlags.Any);
  },
  convert(_converter, _type) {
    return new M.IntrinsicType("any");
  },
};

const arrayTypeConverter: TypeConverter<ts.TypeReference, M.ArrayType> = {
  supports(type, checker) {
    // See Microsoft/TypeScript#37711 for tracking removing the internal annotation on this helper
    return (checker as any).isArrayType(type);
  },
  convert(converter, type) {
    return new M.ArrayType(
      converter.convertType(void 0, type.target.typeParameters![0])
    );
  },
};

const booleanTypeConverter: TypeConverter<ts.Type, M.IntrinsicType> = {
  supports(type) {
    return Boolean(type.flags & ts.TypeFlags.Boolean);
  },
  convert(_converter, type) {
    return new M.IntrinsicType("boolean");
  },
};

const conditionalConverter: TypeConverter<
  ts.ConditionalType,
  M.ConditionalType
> = {
  supports(type) {
    return Boolean(type.flags & ts.TypeFlags.Conditional);
  },
  convert(converter, type) {
    return new M.ConditionalType(
      converter.convertType(void 0, type.checkType),
      converter.convertType(void 0, type.extendsType),
      converter.convertType(void 0, type.resolvedTrueType),
      converter.convertType(void 0, type.resolvedFalseType)
    );
  },
};

const literalTypeConverter: TypeConverter<ts.LiteralType, M.LiteralType> = {
  supports(type) {
    return Boolean(type.flags & ts.TypeFlags.Literal);
  },
  convert(_converter, type) {
    if (typeof type.value === "object") {
      return new M.LiteralType({
        value: type.value.base10Value,
        negative: type.value.negative,
      });
    }
    return new M.LiteralType(type.value);
  },
};

const objectTypeConverter: TypeConverter<ts.ObjectType, M.ObjectType> = {
  // Almost everything is an object type... but not everything should be converted as one.
  // This needs to run last so we don't end up with an infinite loop.
  order: 100,
  supports(type) {
    return isObjectType(type);
  },
  convert(converter, type, checker) {
    const properties = type.getProperties().map((symbol) => {
      const type = checker.getTypeOfSymbolAtLocation(
        symbol,
        symbol.valueDeclaration
      );
      return new M.PropertyType(
        symbol.name,
        hasReadonlyModifier(symbol.valueDeclaration),
        Boolean(symbol.flags & ts.SymbolFlags.Optional),
        converter.convertType(void 0, type)
      );
    });

    const signatures = type
      .getCallSignatures()
      .map(
        (signature) =>
          new M.SignatureType(
            convertTypeParameters(
              converter,
              signature.getTypeParameters() ?? []
            ),
            convertParameters(converter, signature.getParameters() ?? []),
            converter.convertType(void 0, signature.getReturnType())
          )
      );

    const constructSignatures = type
      .getConstructSignatures()
      .map(
        (signature) =>
          new M.ConstructorType(
            convertTypeParameters(
              converter,
              signature.getTypeParameters() ?? []
            ),
            convertParameters(converter, signature.getParameters() ?? []),
            converter.convertType(void 0, signature.getReturnType())
          )
      );

    return new M.ObjectType(properties, signatures, constructSignatures);
  },
};

const numberTypeConverter: TypeConverter<ts.Type, M.IntrinsicType> = {
  supports(type) {
    return Boolean(type.flags & ts.TypeFlags.Number);
  },
  convert(_converter, type) {
    return new M.IntrinsicType("number");
  },
};

const referenceTypeConverter: TypeConverter<ts.Type, M.ReferenceType> = {
  order: 50, // After array.
  supports(type) {
    return !!type.aliasSymbol;
  },
  convert(converter, type: ts.Type & { aliasSymbol: ts.Symbol }) {
    return new M.ReferenceType(
      type.aliasSymbol.name,
      type.aliasTypeArguments?.map((arg) =>
        converter.convertType(void 0, arg)
      ) ?? [],
      type.aliasSymbol,
      false,
      converter.project
    );
  },
};

const stringTypeConverter: TypeConverter<ts.Type, M.IntrinsicType> = {
  supports(type) {
    return Boolean(type.flags & ts.TypeFlags.String);
  },
  convert(_converter, type) {
    return new M.IntrinsicType("string");
  },
};

const tupleTypeConverter: TypeConverter<ts.TupleType, M.TupleType> = {
  supports(type) {
    return (
      isObjectType(type) && Boolean(type.objectFlags & ts.ObjectFlags.Tuple)
    );
  },
  convert(converter, type) {
    return new M.TupleType(
      type.typeArguments?.map((type) => converter.convertType(void 0, type)) ??
        []
    );
  },
};

const typeParameterConverter: TypeConverter<
  ts.TypeParameter,
  M.TypeParameterType
> = {
  supports(type) {
    return Boolean(type.flags & ts.TypeFlags.TypeParameter);
  },
  convert(converter, type) {
    return convertTypeParameters(converter, [type])[0];
  },
};

const unionOrIntersectionConverter: TypeConverter<
  ts.UnionOrIntersectionType,
  M.UnionType | M.IntersectionType
> = {
  supports(type) {
    return type.isUnionOrIntersection();
  },
  convert(converter, type) {
    const types = type.types.map((type) => converter.convertType(void 0, type));
    return type.isUnion()
      ? new M.UnionType(types)
      : new M.IntersectionType(types);
  },
};

const voidTypeConverter: TypeConverter<ts.Type, M.IntrinsicType> = {
  supports(type) {
    return Boolean(type.flags & ts.TypeFlags.Void);
  },
  convert(_converter, type) {
    return new M.IntrinsicType("void");
  },
};

/// Helpers
function isObjectType(type: ts.Type): type is ts.ObjectType {
  return typeof (type as any).objectFlags === "number";
}

function hasQuestionToken(declaration: ts.Declaration): boolean {
  return !!(declaration as any).questionToken;
}

function hasDotDotDotToken(declaration: ts.Declaration): boolean {
  return !!(declaration as any).dotDotDotToken;
}

function convertTypeParameters(
  converter: Converter,
  parameters: readonly ts.TypeParameter[]
): M.TypeParameterType[] {
  return parameters.map((param) => {
    const constraintType = param.getConstraint();
    const constraint = constraintType
      ? converter.convertType(void 0, constraintType)
      : undefined;
    const defaultType = param.getDefault();
    const defaultValue = defaultType
      ? converter.convertType(void 0, defaultType)
      : undefined;

    return new M.TypeParameterType(param.symbol.name, constraint, defaultValue);
  });
}

function convertParameters(
  converter: Converter,
  parameters: readonly ts.Symbol[]
): M.SignatureParameterType[] {
  return parameters.map((symbol, index) => {
    const type = converter.convertType(
      void 0,
      converter.checker.getTypeOfSymbolAtLocation(
        symbol,
        symbol.valueDeclaration
      )
    );
    return new M.SignatureParameterType(
      symbol.name,
      hasQuestionToken(symbol.valueDeclaration),
      hasDotDotDotToken(symbol.valueDeclaration),
      type
    );
  });
}
