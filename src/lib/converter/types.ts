import * as assert from "assert";
import * as ts from "typescript";
import * as M from "../models";
import type { Converter } from "./converter";
import {
  convertTypeParameters,
  convertParameters,
  hasReadonlyModifier,
  convertTypeParameterDeclarations,
  convertParameterSymbols,
} from "./utils";
import { OptionalModifier } from "../models/types/mapped";

export interface TypeConverter<
  TNode extends ts.TypeNode = ts.TypeNode,
  TType extends ts.Type = ts.Type,
  O extends M.SomeType = M.SomeType
> {
  kind: TNode["kind"][];
  // getTypeAtLocation is expensive, so don't pass the type here.
  convert(converter: Converter, node: TNode): O | M.UnknownType;
  // We use typeToTypeNode to figure out what method to call in the first place,
  // so we have a non-type-checkable node here, necessary for some converters.
  convertType(
    converter: Converter,
    type: TType,
    node: TNode
  ): O | M.UnknownType;
}

export function addTypeConverters(converter: Converter): void {
  for (const typeNodeConverter of [
    arrayTypeNodeConverter,
    conditionalTypeNodeConverter,
    constructorTypeNodeConverter,
    exprWithTypeArgsTypeNodeConverter,
    functionTypeNodeConverter,
    indexedAccessTypeNodeConverter,
    inferTypeNodeConverter,
    intersectionTypeNodeConverter,
    keywordTypeNodeConverter,
    literalTypeNodeConverter,
    literalBooleanConverter,
    mappedConverter,
    operatorTypeNodeConverter,
    parenthesizedTypeNodeConverter,
    predicateTypeNodeConverter,
    queryTypeNodeConverter,
    referenceTypeNodeConverter,
    thisTypeNodeConverter,
    tupleTypeNodeConverter,
    typeLiteralConverter,
    unionTypeNodeConverter,
  ]) {
    converter.addTypeNodeConverter(typeNodeConverter);
  }
}

// T[], Array<T>
const arrayTypeNodeConverter: TypeConverter<
  ts.ArrayTypeNode,
  ts.TypeReference,
  M.ArrayType
> = {
  kind: [ts.SyntaxKind.ArrayType],
  convert(converter, node) {
    return new M.ArrayType(converter.convertType(node.elementType));
  },
  convertType(converter, type) {
    assert(type.target.typeParameters);
    return new M.ArrayType(
      converter.convertType(type.target.typeParameters[0])
    );
  },
};

// Check extends Extends ? True : False
const conditionalTypeNodeConverter: TypeConverter<
  ts.ConditionalTypeNode,
  ts.ConditionalType,
  M.ConditionalType
> = {
  kind: [ts.SyntaxKind.ConditionalType],
  convert(converter, node) {
    return new M.ConditionalType(
      converter.convertType(node.checkType),
      converter.convertType(node.extendsType),
      converter.convertType(node.trueType),
      converter.convertType(node.falseType)
    );
  },
  convertType(converter, type) {
    return new M.ConditionalType(
      converter.convertType(type.checkType),
      converter.convertType(type.extendsType),
      converter.convertType(type.resolvedTrueType),
      converter.convertType(type.resolvedFalseType)
    );
  },
};

// new () => Obj
const constructorTypeNodeConverter: TypeConverter<
  ts.ConstructorTypeNode,
  ts.Type,
  M.ConstructorType
> = {
  kind: [ts.SyntaxKind.ConstructorType],
  convert(converter, node) {
    return new M.ConstructorType(
      convertTypeParameterDeclarations(converter, node.typeParameters ?? []),
      convertParameters(converter, node.parameters),
      converter.convertType(node.type)
    );
  },
  convertType(converter, type) {
    const signature = type.getConstructSignatures()[0];
    return new M.ConstructorType(
      convertTypeParameters(converter, signature.getTypeParameters() ?? []),
      convertParameterSymbols(converter, signature.getParameters() ?? []),
      converter.convertType(signature.getReturnType())
    );
  },
};

const exprWithTypeArgsTypeNodeConverter: TypeConverter<
  ts.ExpressionWithTypeArguments,
  ts.Type,
  M.SomeType
> = {
  kind: [ts.SyntaxKind.ExpressionWithTypeArguments],
  convert(converter, node) {
    const targetSymbol = converter.checker.getSymbolAtLocation(node.expression);
    // Mixins... we might not have a symbol here.
    if (!targetSymbol) {
      return converter.convertType(converter.checker.getTypeAtLocation(node));
    }
    const parameters = node.typeArguments?.map(converter.convertType) ?? [];
    return new M.ReferenceType(
      targetSymbol.name,
      parameters,
      targetSymbol,
      false,
      converter.project
    );
  },
  // I don't think this is possible... expressions should always have type nodes.
  convertType: requestBugReport,
};

const functionTypeNodeConverter: TypeConverter<
  ts.FunctionTypeNode,
  ts.Type,
  M.SignatureType
> = {
  kind: [ts.SyntaxKind.FunctionType],
  convert(converter, node) {
    return new M.SignatureType(
      convertTypeParameterDeclarations(converter, node.typeParameters ?? []),
      convertParameters(converter, node.parameters),
      converter.convertType(node.type)
    );
  },
  convertType(converter, type) {
    const signature = type.getCallSignatures()[0];
    return new M.SignatureType(
      convertTypeParameters(converter, signature.getTypeParameters() ?? []),
      convertParameterSymbols(converter, signature.getParameters() ?? []),
      converter.convertType(signature.getReturnType())
    );
  },
};

// T['a']
const indexedAccessTypeNodeConverter: TypeConverter<
  ts.IndexedAccessTypeNode,
  ts.Type,
  M.IndexedAccessType | M.UnknownType
> = {
  kind: [ts.SyntaxKind.IndexedAccessType],
  convert(converter, node) {
    return new M.IndexedAccessType(
      converter.convertType(node.objectType),
      converter.convertType(node.indexType)
    );
  },
  convertType(converter, type) {
    // I don't think this is possible... these are never inferred.
    return requestBugReport(converter, type);
  },
};

// T extends infer Infer...
const inferTypeNodeConverter: TypeConverter<
  ts.InferTypeNode,
  ts.Type,
  M.InferredType
> = {
  kind: [ts.SyntaxKind.InferType],
  convert(_converter, node) {
    return new M.InferredType(node.typeParameter.name.text);
  },
  convertType(_converter, type) {
    return new M.InferredType(type.symbol.name);
  },
};

// T & U
const intersectionTypeNodeConverter: TypeConverter<
  ts.IntersectionTypeNode,
  ts.IntersectionType,
  M.IntersectionType
> = {
  kind: [ts.SyntaxKind.IntersectionType],
  convert(converter, node) {
    return new M.IntersectionType(node.types.map(converter.convertType));
  },
  convertType(converter, type) {
    return new M.IntersectionType(type.types.map(converter.convertType));
  },
};

const keywordToTypeName: Record<ts.KeywordTypeNode["kind"], string> = {
  [ts.SyntaxKind.AnyKeyword]: "any",
  [ts.SyntaxKind.UnknownKeyword]: "unknown",
  [ts.SyntaxKind.NumberKeyword]: "number",
  [ts.SyntaxKind.BigIntKeyword]: "bigint",
  [ts.SyntaxKind.ObjectKeyword]: "object",
  [ts.SyntaxKind.BooleanKeyword]: "boolean",
  [ts.SyntaxKind.StringKeyword]: "string",
  [ts.SyntaxKind.SymbolKeyword]: "symbol",
  [ts.SyntaxKind.ThisKeyword]: "this",
  [ts.SyntaxKind.VoidKeyword]: "void",
  [ts.SyntaxKind.UndefinedKeyword]: "undefined",
  [ts.SyntaxKind.NullKeyword]: "null",
  [ts.SyntaxKind.NeverKeyword]: "never",
};

const keywordTypeNodeConverter: TypeConverter<
  ts.KeywordTypeNode,
  ts.Type,
  M.IntrinsicType
> = {
  kind: Object.keys(keywordToTypeName).map(Number),
  convert(_converter, node) {
    return new M.IntrinsicType(keywordToTypeName[node.kind]);
  },
  convertType(converter, type) {
    // Note: There is an internal `intrinsicName` property on `type` we could
    // use here, but `typeToString` isn't that much more expensive.
    return new M.IntrinsicType(converter.checker.typeToString(type));
  },
};

// Note: Literal types are not the same as type literals! SyntaxKind.TypeLiteral is an object.
// 1, 1e7, 100n, 'str'
const literalTypeNodeConverter: TypeConverter<
  ts.LiteralTypeNode,
  ts.LiteralType,
  M.LiteralType | M.UnknownType
> = {
  kind: [ts.SyntaxKind.LiteralType],
  convert(converter, node) {
    switch (node.literal.kind) {
      case ts.SyntaxKind.TrueKeyword:
        return new M.LiteralType(true);
      case ts.SyntaxKind.FalseKeyword:
        return new M.LiteralType(false);
      case ts.SyntaxKind.StringLiteral:
        return new M.LiteralType(node.literal.text);
      case ts.SyntaxKind.PrefixUnaryExpression:
      case ts.SyntaxKind.NumericLiteral:
        return new M.LiteralType(Number(node.literal.getText()));
      case ts.SyntaxKind.BigIntLiteral: {
        const negative = node.literal.text[0] === "-";
        const value = node.literal.text.replace(/^[+-]|n$/g, "");
        return new M.LiteralType({ negative, value });
      }
      default:
        return requestBugReport(converter, node.literal);
    }
  },
  convertType(_converter, type) {
    if (typeof type.value === "object") {
      return new M.LiteralType({
        value: type.value.base10Value,
        negative: type.value.negative,
      });
    }
    return new M.LiteralType(type.value);
  },
};

const literalBooleanConverter: TypeConverter = {
  kind: [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword],
  convert(_converter, node) {
    return new M.LiteralType(node.kind === ts.SyntaxKind.TrueKeyword);
  },
  convertType(_converter, _type, node) {
    return new M.LiteralType(node.kind === ts.SyntaxKind.TrueKeyword);
  },
};

const tokenToModifier: Record<
  NonNullable<ts.MappedTypeNode["readonlyToken" | "questionToken"]>["kind"],
  OptionalModifier
> = {
  [ts.SyntaxKind.ReadonlyKeyword]: OptionalModifier.Add,
  [ts.SyntaxKind.QuestionToken]: OptionalModifier.Add,
  [ts.SyntaxKind.PlusToken]: OptionalModifier.Add,
  [ts.SyntaxKind.MinusToken]: OptionalModifier.Remove,
};

const mappedConverter: TypeConverter<
  ts.MappedTypeNode,
  ts.Type & {
    templateType: ts.Type;
    typeParameter: ts.TypeParameter;
    constraintType: ts.Type;
  },
  M.MappedType
> = {
  kind: [ts.SyntaxKind.MappedType],
  convert(converter, node) {
    const parameter = convertTypeParameterDeclarations(converter, [
      node.typeParameter,
    ])[0];
    assert(parameter.constraint, "this should have caused a compiler error.");

    return new M.MappedType(
      node.readonlyToken
        ? tokenToModifier[node.readonlyToken.kind]
        : OptionalModifier.None,
      parameter as M.TypeParameterType & { constraint: M.SomeType },
      node.questionToken
        ? tokenToModifier[node.questionToken.kind]
        : OptionalModifier.None,
      converter.convertType(node.type)
    );
  },
  convertType(converter, type, node) {
    // This can happen if a generic function does not have a return type annotated.
    const parameter = convertTypeParameters(converter, [type.typeParameter])[0];
    parameter.constraint = converter.convertType(type.constraintType);

    return new M.MappedType(
      node.readonlyToken
        ? tokenToModifier[node.readonlyToken.kind]
        : OptionalModifier.None,
      parameter as M.TypeParameterType & { constraint: M.SomeType },
      node.questionToken
        ? tokenToModifier[node.questionToken.kind]
        : OptionalModifier.None,
      converter.convertType(type.templateType)
    );
  },
};

const operators = {
  [ts.SyntaxKind.ReadonlyKeyword]: "readonly",
  [ts.SyntaxKind.KeyOfKeyword]: "keyof",
  [ts.SyntaxKind.UniqueKeyword]: "unique",
} as const;

// keyof T, readonly T, unique symbol
const operatorTypeNodeConverter: TypeConverter<
  ts.TypeOperatorNode,
  ts.Type,
  M.TypeOperatorType
> = {
  kind: [ts.SyntaxKind.TypeOperator],
  convert(converter, node) {
    return new M.TypeOperatorType(
      converter.convertType(node.type),
      operators[node.operator]
    );
  },
  convertType(converter, type, node) {
    // readonly is only valid on array and tuple literal types.
    if (node.operator === ts.SyntaxKind.ReadonlyKeyword) {
      assert(isObjectType(type));
      const args = converter.checker
        .getTypeArguments(type as ts.TypeReference)
        .map(converter.convertType);
      const inner =
        type.objectFlags & ts.ObjectFlags.Tuple
          ? new M.TupleType(args)
          : new M.ArrayType(args[0]);

      return new M.TypeOperatorType(inner, "readonly");
    }

    // keyof will only show up with generic functions, otherwise it gets eagerly
    // resolved to a union of strings.
    if (node.operator === ts.SyntaxKind.KeyOfKeyword) {
      // There's probably an interface for this somewhere... I couldn't find it.
      const targetType = (type as ts.Type & { type: ts.Type }).type;
      return new M.TypeOperatorType(converter.convertType(targetType), "keyof");
    }

    // TS drops `unique` in `unique symbol` everywhere. If someone used it, we ought
    // to have a type node. This shouldn't ever happen.
    return requestBugReport(converter, type);
  },
};

// Just collapse these...
// ((number))
const parenthesizedTypeNodeConverter: TypeConverter<ts.ParenthesizedTypeNode> = {
  kind: [ts.SyntaxKind.ParenthesizedType],
  convert(converter, node) {
    return converter.convertType(node.type);
  },
  convertType: requestBugReport,
};

// function foo(x: any): asserts x is String;
const predicateTypeNodeConverter: TypeConverter<
  ts.TypePredicateNode,
  ts.Type,
  M.PredicateType
> = {
  kind: [ts.SyntaxKind.TypePredicate],
  convert(converter, node) {
    const assertsModifier = !!node.assertsModifier;
    const type = node.type ? converter.convertType(node.type) : undefined;
    return new M.PredicateType(
      node.parameterName.getText(),
      assertsModifier,
      type
    );
  },
  // These are not currently ever inferred. This might change in a future version of TS.
  convertType: requestBugReport,
};

// typeof Foo.bar
const queryTypeNodeConverter: TypeConverter<
  ts.TypeQueryNode,
  ts.Type,
  M.QueryType
> = {
  kind: [ts.SyntaxKind.TypeQuery],
  convert(converter, node) {
    const symbol = converter.checker.getSymbolAtLocation(node.exprName);
    assert(
      symbol,
      `Query type failed to get a symbol for: ${node.exprName.getText()}. This is a bug.`
    );
    return new M.QueryType(
      new M.ReferenceType(symbol.name, [], symbol, true, converter.project)
    );
  },
  convertType(converter, type) {
    const symbol = type.symbol;
    assert(
      symbol,
      `Query type failed to get a symbol for: ${converter.checker.typeToString(
        type
      )}. This is a bug.`
    );
    return new M.QueryType(
      new M.ReferenceType(symbol.name, [], symbol, true, converter.project)
    );
  },
};

// Array<Foo>, Generic<A, B, C>
const referenceTypeNodeConverter: TypeConverter<
  ts.TypeReferenceNode,
  ts.TypeReference,
  M.SomeType
> = {
  kind: [ts.SyntaxKind.TypeReference],
  convert(converter, node) {
    const targetSymbol = converter.checker.getSymbolAtLocation(node.typeName);
    assert(
      targetSymbol,
      `Reference type failed to get a symbol for ${node.typeName.getText()}. This is probably a bug.`
    );
    const parameters =
      node.typeArguments?.map((node) => converter.convertType(node)) ?? [];
    return new M.ReferenceType(
      targetSymbol.name,
      parameters,
      targetSymbol,
      false,
      converter.project
    );
  },
  convertType(converter, type) {
    if (type.symbol) {
      return new M.ReferenceType(
        type.symbol.name,
        type.typeArguments?.map(converter.convertType) ?? [],
        type.symbol,
        false,
        converter.project
      );
    }

    return converter.convertType(type.target);
  },
};

// method(): this
const thisTypeNodeConverter: TypeConverter<
  ts.ThisTypeNode,
  ts.Type,
  M.IntrinsicType
> = {
  kind: [ts.SyntaxKind.ThisType],
  convert() {
    return new M.IntrinsicType("this");
  },
  convertType() {
    return new M.IntrinsicType("this");
  },
};

// [T, U]
const tupleTypeNodeConverter: TypeConverter<
  ts.TupleTypeNode,
  ts.TypeReference,
  M.TupleType
> = {
  kind: [ts.SyntaxKind.TupleType],
  convert(converter, node) {
    return new M.TupleType(node.elementTypes.map(converter.convertType));
  },
  convertType(converter, type) {
    return new M.TupleType(
      converter.checker.getTypeArguments(type).map(converter.convertType)
    );
  },
};

// { a: string, (): string, new (): String }
const typeLiteralConverter: TypeConverter<
  ts.TypeLiteralNode,
  ts.ObjectType,
  M.ObjectType | M.SignatureType | M.ConstructorType
> = {
  kind: [ts.SyntaxKind.TypeLiteral],
  convert(converter, node) {
    const properties = node.members
      .filter(ts.isPropertySignature)
      .map(
        (prop) =>
          new M.PropertyType(
            getPropertyName(prop.name),
            hasReadonlyModifier(prop),
            hasQuestionToken(prop),
            converter.convertType(prop.type)
          )
      );

    const signatures = node.members
      .filter(ts.isCallSignatureDeclaration)
      .map(
        (node) =>
          new M.SignatureType(
            convertTypeParameterDeclarations(
              converter,
              node.typeParameters ?? []
            ),
            convertParameters(converter, node.parameters),
            converter.convertType(node.type)
          )
      );

    const constructSignatures = node.members
      .filter(ts.isConstructSignatureDeclaration)
      .map(
        (node) =>
          new M.ConstructorType(
            convertTypeParameterDeclarations(
              converter,
              node.typeParameters ?? []
            ),
            convertParameters(converter, node.parameters),
            converter.convertType(node.type)
          )
      );

    if (properties.length === 0) {
      if (signatures.length === 1 && constructSignatures.length === 0) {
        return signatures[0];
      }
      if (signatures.length === 0 && constructSignatures.length === 1) {
        return constructSignatures[0];
      }
    }

    return new M.ObjectType(properties, signatures, constructSignatures);
  },
  convertType(converter, type) {
    const properties = type.getProperties().map((symbol) => {
      const type = converter.checker.getTypeOfSymbolAtLocation(
        symbol,
        symbol.valueDeclaration
      );
      return new M.PropertyType(
        symbol.name,
        hasReadonlyModifier(symbol.valueDeclaration),
        Boolean(symbol.flags & ts.SymbolFlags.Optional),
        converter.convertType(type)
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
            convertParameterSymbols(converter, signature.getParameters() ?? []),
            converter.convertType(signature.getReturnType())
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
            convertParameterSymbols(converter, signature.getParameters() ?? []),
            converter.convertType(signature.getReturnType())
          )
      );

    return new M.ObjectType(properties, signatures, constructSignatures);
  },
};

// T | U
const unionTypeNodeConverter: TypeConverter<
  ts.UnionTypeNode,
  ts.UnionType,
  M.UnionType
> = {
  kind: [ts.SyntaxKind.UnionType],
  convert(converter, node) {
    return new M.UnionType(node.types.map(converter.convertType));
  },
  convertType(converter, type) {
    return new M.UnionType(type.types.map(converter.convertType));
  },
};

/// Helpers

function requestBugReport(converter: Converter, nodeOrType: ts.Node | ts.Type) {
  if ("kind" in nodeOrType) {
    converter.logger.warn(
      `Failed to convert type node with kind: ${
        ts.SyntaxKind[nodeOrType.kind]
      } and text ${nodeOrType.getText()}. Please report a bug.`
    );
    return new M.UnknownType(nodeOrType.getText());
  } else {
    const typeString = converter.checker.typeToString(nodeOrType);
    converter.logger.warn(
      `Failed to convert type: ${typeString}. Please report a bug.`
    );
    return new M.UnknownType(typeString);
  }
}

function isObjectType(type: ts.Type): type is ts.ObjectType {
  return typeof (type as any).objectFlags === "number";
}

function hasQuestionToken(declaration: ts.Declaration): boolean {
  return !!(declaration as any).questionToken;
}

function getPropertyName(name: ts.PropertyName): string {
  switch (name.kind) {
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.Identifier:
      return name.text;
    case ts.SyntaxKind.ComputedPropertyName:
    case ts.SyntaxKind.PrivateIdentifier:
      // FUTURE: It would be nice to be able to represent these better.
      return name.getText();
  }
}
