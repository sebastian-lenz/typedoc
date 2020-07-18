import * as assert from "assert";
import * as ts from "typescript";
import * as M from "../models";
import type { Converter } from "./converter";
import {
  convertTypeParameters,
  convertParameters,
  hasReadonlyModifier,
  hasQuestionToken,
} from "./utils";

export interface TypeNodeConverter<
  T extends ts.TypeNode = ts.TypeNode,
  O extends M.SomeType = M.SomeType
> {
  kind: T["kind"][];
  convert(converter: Converter, node: T, type: ts.Type): O;
}

export function addTypeNodeConverters(converter: Converter): void {
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

// T[]
const arrayTypeNodeConverter: TypeNodeConverter<
  ts.ArrayTypeNode,
  M.ArrayType
> = {
  kind: [ts.SyntaxKind.ArrayType],
  convert(converter, node) {
    return new M.ArrayType(converter.convertType(node.elementType));
  },
};

// Check extends Extends ? True : False
const conditionalTypeNodeConverter: TypeNodeConverter<
  ts.ConditionalTypeNode,
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
};

const constructorTypeNodeConverter: TypeNodeConverter<
  ts.ConstructorTypeNode,
  M.ConstructorType
> = {
  kind: [ts.SyntaxKind.ConstructorType],
  convert(converter, node) {
    return new M.ConstructorType(
      convertTypeParameters(converter, node.typeParameters ?? []),
      convertParameters(converter, node.parameters),
      converter.convertType(node.type)
    );
  },
};

const exprWithTypeArgsTypeNodeConverter: TypeNodeConverter<
  ts.ExpressionWithTypeArguments,
  M.SomeType
> = {
  kind: [ts.SyntaxKind.ExpressionWithTypeArguments],
  convert(converter, node) {
    const targetSymbol = converter.checker.getSymbolAtLocation(node.expression);
    // Mixins... we might not have a symbol here.
    if (!targetSymbol) {
      return converter.convertType(
        undefined,
        converter.checker.getTypeAtLocation(node)
      );
    }
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
};

const functionTypeNodeConverter: TypeNodeConverter<
  ts.FunctionTypeNode,
  M.SignatureType
> = {
  kind: [ts.SyntaxKind.FunctionType],
  convert(converter, node) {
    return new M.SignatureType(
      convertTypeParameters(converter, node.typeParameters ?? []),
      convertParameters(converter, node.parameters),
      converter.convertType(node.type)
    );
  },
};

// T['a']
const indexedAccessTypeNodeConverter: TypeNodeConverter<
  ts.IndexedAccessTypeNode,
  M.IndexedAccessType
> = {
  kind: [ts.SyntaxKind.IndexedAccessType],
  convert(converter, node) {
    return new M.IndexedAccessType(
      converter.convertType(node.objectType),
      converter.convertType(node.indexType)
    );
  },
};

// T extends infer Infer...
const inferTypeNodeConverter: TypeNodeConverter<
  ts.InferTypeNode,
  M.InferredType
> = {
  kind: [ts.SyntaxKind.InferType],
  convert(_converter, node) {
    return new M.InferredType(node.typeParameter.name.text);
  },
};

// T & U
const intersectionTypeNodeConverter: TypeNodeConverter<
  ts.IntersectionTypeNode,
  M.IntersectionType
> = {
  kind: [ts.SyntaxKind.IntersectionType],
  convert(converter, node) {
    return new M.IntersectionType(
      node.types.map((node) => converter.convertType(node))
    );
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

const keywordTypeNodeConverter: TypeNodeConverter<
  ts.KeywordTypeNode,
  M.IntrinsicType
> = {
  kind: Object.keys(keywordToTypeName).map(Number),
  convert(_converter, node) {
    return new M.IntrinsicType(keywordToTypeName[node.kind]);
  },
};

// Note: Literal types are not the same as type literals! SyntaxKind.TypeLiteral is an object.
const literalTypeNodeConverter: TypeNodeConverter<
  ts.LiteralTypeNode,
  M.LiteralType
> = {
  kind: [ts.SyntaxKind.LiteralType],
  convert(converter, node) {
    let value = getLiteralValue(node.literal);
    if (value === undefined) {
      converter.logger.warn(
        `Failed to get value of literal with kind: ${
          ts.SyntaxKind[node.literal.kind]
        } and text ${node.literal.getText()}. This is a bug.`
      );
      value = node.literal.getText();
    }
    return new M.LiteralType(value);
  },
};

const operators = {
  [ts.SyntaxKind.ReadonlyKeyword]: "readonly",
  [ts.SyntaxKind.KeyOfKeyword]: "keyof",
  [ts.SyntaxKind.UniqueKeyword]: "unique",
} as const;

// keyof T, readonly T, unique symbol
const operatorTypeNodeConverter: TypeNodeConverter<
  ts.TypeOperatorNode,
  M.TypeOperatorType
> = {
  kind: [ts.SyntaxKind.TypeOperator],
  convert(converter, node) {
    return new M.TypeOperatorType(
      converter.convertType(node.type),
      operators[node.operator]
    );
  },
};

// Just collapse these...
// type In = ((number))
const parenthesizedTypeNodeConverter: TypeNodeConverter<ts.ParenthesizedTypeNode> = {
  kind: [ts.SyntaxKind.ParenthesizedType],
  convert(converter, node) {
    return converter.convertType(node.type);
  },
};

// function foo(x: any): asserts x is String;
const predicateTypeNodeConverter: TypeNodeConverter<
  ts.TypePredicateNode,
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
};

// typeof Foo.bar
const queryTypeNodeConverter: TypeNodeConverter<
  ts.TypeQueryNode,
  M.QueryType
> = {
  kind: [ts.SyntaxKind.TypeQuery],
  convert(converter, node) {
    const symbol = converter.checker.getSymbolAtLocation(node.exprName);
    assert(
      symbol,
      `Query type failed to get a symbol for: ${node.exprName.getText()}. This is probably a bug.`
    );
    return new M.QueryType(
      new M.ReferenceType(symbol.name, [], symbol, true, converter.project)
    );
  },
};

// Array<Foo>
const referenceTypeNodeConverter: TypeNodeConverter<
  ts.TypeReferenceNode,
  M.ReferenceType
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
};

// method(): this
const thisTypeNodeConverter: TypeNodeConverter<
  ts.ThisTypeNode,
  M.IntrinsicType
> = {
  kind: [ts.SyntaxKind.ThisType],
  convert() {
    return new M.IntrinsicType("this");
  },
};

// [T, U]
const tupleTypeNodeConverter: TypeNodeConverter<
  ts.TupleTypeNode,
  M.TupleType
> = {
  kind: [ts.SyntaxKind.TupleType],
  convert(converter, node) {
    return new M.TupleType(
      node.elementTypes.map((node) => converter.convertType(node))
    );
  },
};

// { a: string, (): string, new (): String }
const typeLiteralConverter: TypeNodeConverter<
  ts.TypeLiteralNode,
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
            converter.convertType(
              prop.type,
              converter.checker.getTypeAtLocation(prop)
            )
          )
      );

    const signatures = node.members
      .filter(ts.isCallSignatureDeclaration)
      .map(
        (node) =>
          new M.SignatureType(
            convertTypeParameters(converter, node.typeParameters ?? []),
            convertParameters(converter, node.parameters),
            converter.convertType(node.type)
          )
      );

    const constructSignatures = node.members
      .filter(ts.isConstructSignatureDeclaration)
      .map(
        (node) =>
          new M.ConstructorType(
            convertTypeParameters(converter, node.typeParameters ?? []),
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
};

// T | U
const unionTypeNodeConverter: TypeNodeConverter<
  ts.UnionTypeNode,
  M.UnionType
> = {
  kind: [ts.SyntaxKind.UnionType],
  convert(converter, node) {
    return new M.UnionType(
      node.types.map((node) => converter.convertType(node))
    );
  },
};

/// Helpers

// true, false, 'str', 1e7, -1
function getLiteralValue(
  value: ts.BooleanLiteral | ts.LiteralExpression | ts.PrefixUnaryExpression
): string | number | boolean | undefined {
  switch (value.kind) {
    case ts.SyntaxKind.TrueKeyword:
      return true;
    case ts.SyntaxKind.FalseKeyword:
      return false;
    case ts.SyntaxKind.StringLiteral:
      return value.text;
    case ts.SyntaxKind.PrefixUnaryExpression:
    case ts.SyntaxKind.NumericLiteral:
      return Number(value.getText());
  }
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
