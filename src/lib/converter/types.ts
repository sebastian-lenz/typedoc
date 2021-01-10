import * as assert from "assert";
import * as ts from "typescript";
import {
    ArrayType,
    ConditionalType,
    DeclarationReflection,
    IndexedAccessType,
    InferredType,
    IntersectionType,
    IntrinsicType,
    NamedTupleMember,
    PredicateType,
    QueryType,
    ReferenceType,
    ReflectionKind,
    ReflectionType,
    LiteralType,
    TupleType,
    Type,
    TypeOperatorType,
    UnionType,
    UnknownType,
    MappedType,
    SignatureReflection,
} from "../models";
import { OptionalType } from "../models/types/optional";
import { RestType } from "../models/types/rest";
import { TemplateLiteralType } from "../models/types/template-literal";
import { zip } from "../utils/array";
import { Context } from "./context";
import { ConverterEvents } from "./converter-events";
import { convertIndexSignature } from "./factories/index-signature";
import {
    convertParameterNodes,
    convertTypeParameterNodes,
    createSignature,
} from "./factories/signature";
import { convertSymbol } from "./symbols";
import { removeUndefined } from "./utils/reflections";

export interface TypeConverter<
    TNode extends ts.TypeNode = ts.TypeNode,
    TType extends ts.Type = ts.Type
> {
    kind: TNode["kind"][];
    // getTypeAtLocation is expensive, so don't pass the type here.
    convert(context: Context, node: TNode): Type;
    // We use typeToTypeNode to figure out what method to call in the first place,
    // so we have a non-type-checkable node here, necessary for some converters.
    convertType(context: Context, type: TType, node: TNode): Type;
}

const converters = new Map<ts.SyntaxKind, TypeConverter>();
export function loadConverters() {
    if (converters.size) return;

    for (const actor of [
        arrayConverter,
        conditionalConverter,
        constructorConverter,
        exprWithTypeArgsConverter,
        functionTypeConverter,
        importType,
        indexedAccessConverter,
        inferredConverter,
        intersectionConverter,
        jsDocVariadicTypeConverter,
        keywordConverter,
        optionalConverter,
        parensConverter,
        predicateConverter,
        queryConverter,
        typeLiteralConverter,
        referenceConverter,
        restConverter,
        namedTupleMemberConverter,
        mappedConverter,
        literalTypeConverter,
        templateLiteralConverter,
        thisConverter,
        tupleConverter,
        typeOperatorConverter,
        unionConverter,
    ]) {
        for (const key of actor.kind) {
            if (key === undefined) {
                // Might happen if running on an older TS version.
                continue;
            }
            assert(!converters.has(key));
            converters.set(key, actor);
        }
    }
}

// This ought not be necessary, but we need some way to discover recursively
// typed symbols which do not have type nodes. See the `recursive` symbol in the variables test.
const seenTypeSymbols = new Set<ts.Symbol>();

export function convertType(
    context: Context,
    typeOrNode: ts.Type | ts.TypeNode | undefined
) {
    if (!typeOrNode) {
        return new IntrinsicType("any");
    }

    loadConverters();
    if ("kind" in typeOrNode) {
        const converter = converters.get(typeOrNode.kind);
        if (converter) {
            return converter.convert(context, typeOrNode);
        }
        return requestBugReport(context, typeOrNode);
    }

    // IgnoreErrors is important, without it, we can't assert that we will get a node.
    const node = context.checker.typeToTypeNode(
        typeOrNode,
        void 0,
        ts.NodeBuilderFlags.IgnoreErrors
    );
    assert(node); // According to the TS source of typeToString, this is a bug if it does not hold.

    const symbol = typeOrNode.getSymbol();
    if (symbol) {
        if (
            node.kind !== ts.SyntaxKind.TypeReference &&
            node.kind !== ts.SyntaxKind.ArrayType &&
            seenTypeSymbols.has(symbol)
        ) {
            const typeString = context.checker.typeToString(typeOrNode);
            context.logger.verbose(
                `Refusing to recurse when converting type: ${typeString}`
            );
            return new UnknownType(typeString);
        }
        seenTypeSymbols.add(symbol);
    }

    const converter = converters.get(node.kind);
    if (converter) {
        const result = converter.convertType(context, typeOrNode, node);
        if (symbol) seenTypeSymbols.delete(symbol);
        return result;
    }

    return requestBugReport(context, typeOrNode);
}

const arrayConverter: TypeConverter<ts.ArrayTypeNode, ts.TypeReference> = {
    kind: [ts.SyntaxKind.ArrayType],
    convert(context, node) {
        return new ArrayType(convertType(context, node.elementType));
    },
    convertType(context, type) {
        const params = context.checker.getTypeArguments(type);
        // This is *almost* always true... except for when this type is in the constraint of a type parameter see GH#1408
        // assert(params.length === 1);
        assert(params.length > 0);
        return new ArrayType(convertType(context, params[0]));
    },
};

const conditionalConverter: TypeConverter<
    ts.ConditionalTypeNode,
    ts.ConditionalType
> = {
    kind: [ts.SyntaxKind.ConditionalType],
    convert(context, node) {
        return new ConditionalType(
            convertType(context, node.checkType),
            convertType(context, node.extendsType),
            convertType(context, node.trueType),
            convertType(context, node.falseType)
        );
    },
    convertType(context, type) {
        return new ConditionalType(
            convertType(context, type.checkType),
            convertType(context, type.extendsType),
            convertType(context, type.resolvedTrueType),
            convertType(context, type.resolvedFalseType)
        );
    },
};

const constructorConverter: TypeConverter<ts.ConstructorTypeNode, ts.Type> = {
    kind: [ts.SyntaxKind.ConstructorType],
    convert(context, node) {
        const symbol = context.getSymbolAtLocation(node) ?? node.symbol;
        const type = context.getTypeAtLocation(node);
        if (!symbol || !type) {
            return new IntrinsicType("Function");
        }

        const reflection = new DeclarationReflection(
            "__type",
            ReflectionKind.Constructor,
            context.scope
        );
        const rc = context.withScope(reflection);
        rc.setConvertingTypeNode();

        context.registerReflection(reflection, symbol);
        context.trigger(ConverterEvents.CREATE_DECLARATION, reflection, node);

        const signature = new SignatureReflection(
            "__type",
            ReflectionKind.ConstructorSignature,
            reflection
        );
        context.registerReflection(signature, void 0);
        const signatureCtx = rc.withScope(signature);

        reflection.signatures = [signature];
        signature.type = convertType(signatureCtx, node.type);
        signature.parameters = convertParameterNodes(
            signatureCtx,
            signature,
            node.parameters
        );
        signature.typeParameters = convertTypeParameterNodes(
            signatureCtx,
            node.typeParameters
        );

        return new ReflectionType(reflection);
    },
    convertType(context, type) {
        if (!type.symbol) {
            return new IntrinsicType("Function");
        }

        const reflection = new DeclarationReflection(
            "__type",
            ReflectionKind.Constructor,
            context.scope
        );
        context.registerReflection(reflection, type.symbol);
        context.trigger(ConverterEvents.CREATE_DECLARATION, reflection);

        reflection.signatures = [
            createSignature(
                context.withScope(reflection),
                ReflectionKind.ConstructorSignature,
                type.getConstructSignatures()[0]
            ),
        ];

        return new ReflectionType(reflection);
    },
};

const exprWithTypeArgsConverter: TypeConverter<
    ts.ExpressionWithTypeArguments,
    ts.Type
> = {
    kind: [ts.SyntaxKind.ExpressionWithTypeArguments],
    convert(context, node) {
        const targetSymbol = context.getSymbolAtLocation(node.expression);
        // Mixins... we might not have a symbol here.
        if (!targetSymbol) {
            return convertType(
                context,
                context.checker.getTypeAtLocation(node)
            );
        }
        const parameters =
            node.typeArguments?.map((type) => convertType(context, type)) ?? [];
        const ref = new ReferenceType(
            targetSymbol.name,
            context.resolveAliasedSymbol(targetSymbol),
            context.project
        );
        ref.typeArguments = parameters;
        return ref;
    },
    convertType: requestBugReport,
};

const functionTypeConverter: TypeConverter<ts.FunctionTypeNode, ts.Type> = {
    kind: [ts.SyntaxKind.FunctionType],
    convert(context, node) {
        const symbol = context.getSymbolAtLocation(node) ?? node.symbol;
        const type = context.getTypeAtLocation(node);
        if (!symbol || !type) {
            return new IntrinsicType("Function");
        }

        const reflection = new DeclarationReflection(
            "__type",
            ReflectionKind.TypeLiteral,
            context.scope
        );
        const rc = context.withScope(reflection);

        context.registerReflection(reflection, symbol);
        context.trigger(ConverterEvents.CREATE_DECLARATION, reflection, node);

        const signature = new SignatureReflection(
            "__type",
            ReflectionKind.CallSignature,
            reflection
        );
        context.registerReflection(signature, void 0);
        const signatureCtx = rc.withScope(signature);

        reflection.signatures = [signature];
        signature.type = convertType(signatureCtx, node.type);
        signature.parameters = convertParameterNodes(
            signatureCtx,
            signature,
            node.parameters
        );
        signature.typeParameters = convertTypeParameterNodes(
            signatureCtx,
            node.typeParameters
        );

        return new ReflectionType(reflection);
    },
    convertType(context, type) {
        if (!type.symbol) {
            return new IntrinsicType("Function");
        }

        const reflection = new DeclarationReflection(
            "__type",
            ReflectionKind.TypeLiteral,
            context.scope
        );
        context.registerReflection(reflection, type.symbol);
        context.trigger(ConverterEvents.CREATE_DECLARATION, reflection);

        reflection.signatures = [
            createSignature(
                context.withScope(reflection),
                ReflectionKind.CallSignature,
                type.getCallSignatures()[0]
            ),
        ];

        return new ReflectionType(reflection);
    },
};

const importType: TypeConverter<ts.ImportTypeNode> = {
    kind: [ts.SyntaxKind.ImportType],
    convert(context, node) {
        const name = node.qualifier?.getText() ?? "__module";
        const symbol = context.checker.getSymbolAtLocation(node);
        assert(symbol, "Missing symbol when converting import type node");
        return new ReferenceType(name, symbol, context.project);
    },
    convertType(context, type) {
        const symbol = type.getSymbol();
        assert(symbol, "Missing symbol when converting import type"); // Should be a compiler error
        return new ReferenceType("__module", symbol, context.project);
    },
};

const indexedAccessConverter: TypeConverter<
    ts.IndexedAccessTypeNode,
    ts.IndexedAccessType
> = {
    kind: [ts.SyntaxKind.IndexedAccessType],
    convert(context, node) {
        return new IndexedAccessType(
            convertType(context, node.objectType),
            convertType(context, node.indexType)
        );
    },
    convertType(context, type) {
        return new IndexedAccessType(
            convertType(context, type.objectType),
            convertType(context, type.indexType)
        );
    },
};

const inferredConverter: TypeConverter<ts.InferTypeNode> = {
    kind: [ts.SyntaxKind.InferType],
    convert(_context, node) {
        return new InferredType(node.typeParameter.getText());
    },
    convertType(_context, type) {
        return new InferredType(type.symbol.name);
    },
};

const intersectionConverter: TypeConverter<
    ts.IntersectionTypeNode,
    ts.IntersectionType
> = {
    kind: [ts.SyntaxKind.IntersectionType],
    convert(context, node) {
        return new IntersectionType(
            node.types.map((type) => convertType(context, type))
        );
    },
    convertType(context, type) {
        return new IntersectionType(
            type.types.map((type) => convertType(context, type))
        );
    },
};

const jsDocVariadicTypeConverter: TypeConverter<ts.JSDocVariadicType> = {
    kind: [ts.SyntaxKind.JSDocVariadicType],
    convert(context, node) {
        return new ArrayType(convertType(context, node.type));
    },
    // Should just be an ArrayType
    convertType: requestBugReport,
};

const keywordNames = {
    [ts.SyntaxKind.AnyKeyword]: "any",
    [ts.SyntaxKind.BigIntKeyword]: "bigint",
    [ts.SyntaxKind.BooleanKeyword]: "boolean",
    [ts.SyntaxKind.NeverKeyword]: "never",
    [ts.SyntaxKind.NumberKeyword]: "number",
    [ts.SyntaxKind.ObjectKeyword]: "object",
    [ts.SyntaxKind.StringKeyword]: "string",
    [ts.SyntaxKind.SymbolKeyword]: "symbol",
    [ts.SyntaxKind.UndefinedKeyword]: "undefined",
    [ts.SyntaxKind.UnknownKeyword]: "unknown",
    [ts.SyntaxKind.VoidKeyword]: "void",
    [ts.SyntaxKind.IntrinsicKeyword]: "intrinsic",
};

const keywordConverter: TypeConverter<ts.KeywordTypeNode> = {
    kind: [
        ts.SyntaxKind.AnyKeyword,
        ts.SyntaxKind.BigIntKeyword,
        ts.SyntaxKind.BooleanKeyword,
        ts.SyntaxKind.NeverKeyword,
        ts.SyntaxKind.NumberKeyword,
        ts.SyntaxKind.ObjectKeyword,
        ts.SyntaxKind.StringKeyword,
        ts.SyntaxKind.SymbolKeyword,
        ts.SyntaxKind.UndefinedKeyword,
        ts.SyntaxKind.UnknownKeyword,
        ts.SyntaxKind.VoidKeyword,
    ],
    convert(_context, node) {
        return new IntrinsicType(keywordNames[node.kind]);
    },
    convertType(_context, _type, node) {
        return new IntrinsicType(keywordNames[node.kind]);
    },
};

const optionalConverter: TypeConverter<ts.OptionalTypeNode> = {
    kind: [ts.SyntaxKind.OptionalType],
    convert(context, node) {
        return new OptionalType(
            removeUndefined(convertType(context, node.type))
        );
    },
    // Handled by the tuple converter
    convertType: requestBugReport,
};

const parensConverter: TypeConverter<ts.ParenthesizedTypeNode> = {
    kind: [ts.SyntaxKind.ParenthesizedType],
    convert(context, node) {
        return convertType(context, node.type);
    },
    // TS strips these out too... shouldn't run into this.
    convertType: requestBugReport,
};

const predicateConverter: TypeConverter<ts.TypePredicateNode, ts.Type> = {
    kind: [ts.SyntaxKind.TypePredicate],
    convert(context, node) {
        const name = ts.isThisTypeNode(node.parameterName)
            ? "this"
            : node.parameterName.getText();
        const asserts = !!node.assertsModifier;
        const targetType = node.type ? convertType(context, node.type) : void 0;
        return new PredicateType(name, asserts, targetType);
    },
    // Never inferred by TS 4.0, could potentially change in a future TS version.
    convertType: requestBugReport,
};

// This is a horrible thing... we're going to want to split this into converters
// for different types at some point.
const typeLiteralConverter: TypeConverter<ts.TypeLiteralNode> = {
    kind: [ts.SyntaxKind.TypeLiteral],
    convert(context, node) {
        const symbol = context.getSymbolAtLocation(node) ?? node.symbol;
        const type = context.getTypeAtLocation(node);
        if (!symbol || !type) {
            return new IntrinsicType("Object");
        }

        const reflection = new DeclarationReflection(
            "__type",
            ReflectionKind.TypeLiteral,
            context.scope
        );
        const rc = context.withScope(reflection);
        rc.setConvertingTypeNode();

        context.registerReflection(reflection, symbol);
        context.trigger(ConverterEvents.CREATE_DECLARATION, reflection, node);

        for (const prop of context.checker.getPropertiesOfType(type)) {
            convertSymbol(rc, prop);
        }
        for (const signature of type.getCallSignatures()) {
            reflection.signatures ??= [];
            reflection.signatures.push(
                createSignature(rc, ReflectionKind.CallSignature, signature)
            );
        }

        convertIndexSignature(rc, symbol);

        return new ReflectionType(reflection);
    },
    convertType(context, type) {
        if (!type.symbol) {
            return new IntrinsicType("Object");
        }

        const reflection = new DeclarationReflection(
            "__type",
            ReflectionKind.TypeLiteral,
            context.scope
        );
        context.registerReflection(reflection, type.symbol);
        context.trigger(ConverterEvents.CREATE_DECLARATION, reflection);

        for (const prop of context.checker.getPropertiesOfType(type)) {
            convertSymbol(context.withScope(reflection), prop);
        }
        for (const signature of type.getCallSignatures()) {
            reflection.signatures ??= [];
            reflection.signatures.push(
                createSignature(
                    context.withScope(reflection),
                    ReflectionKind.CallSignature,
                    signature
                )
            );
        }

        convertIndexSignature(context.withScope(reflection), type.symbol);

        return new ReflectionType(reflection);
    },
};

const queryConverter: TypeConverter<ts.TypeQueryNode> = {
    kind: [ts.SyntaxKind.TypeQuery],
    convert(context, node) {
        const querySymbol = context.expectSymbolAtLocation(node.exprName);
        return new QueryType(
            new ReferenceType(
                node.exprName.getText(),
                context.resolveAliasedSymbol(querySymbol),
                context.project
            )
        );
    },
    convertType(context, type) {
        const symbol = type.getSymbol();
        assert(
            symbol,
            `Query type failed to get a symbol for: ${context.checker.typeToString(
                type
            )}. This is a bug.`
        );
        return new QueryType(
            new ReferenceType(
                symbol.name,
                context.resolveAliasedSymbol(symbol),
                context.project
            )
        );
    },
};

const referenceConverter: TypeConverter<
    ts.TypeReferenceNode,
    ts.TypeReference
> = {
    kind: [ts.SyntaxKind.TypeReference],
    convert(context, node) {
        const isArray =
            context.checker.typeToTypeNode(
                context.checker.getTypeAtLocation(node.typeName),
                void 0,
                ts.NodeBuilderFlags.IgnoreErrors
            )?.kind === ts.SyntaxKind.ArrayType;

        if (isArray) {
            return new ArrayType(convertType(context, node.typeArguments?.[0]));
        }

        const symbol = context.expectSymbolAtLocation(node.typeName);

        const name = node.typeName.getText();

        const type = new ReferenceType(
            name,
            context.resolveAliasedSymbol(symbol),
            context.project
        );
        type.typeArguments = node.typeArguments?.map((type) =>
            convertType(context, type)
        );
        return type;
    },
    convertType(context, type) {
        const symbol = type.aliasSymbol ?? type.getSymbol();
        if (!symbol) {
            // This happens when we get a reference to a type parameter
            // created within a mapped type, `K` in: `{ [K in T]: string }`
            return ReferenceType.createBrokenReference(
                context.checker.typeToString(type),
                context.project
            );
        }

        const ref = new ReferenceType(
            symbol.name,
            context.resolveAliasedSymbol(symbol),
            context.project
        );
        ref.typeArguments = (type.aliasSymbol
            ? type.aliasTypeArguments
            : type.typeArguments
        )?.map((ref) => convertType(context, ref));
        return ref;
    },
};

const restConverter: TypeConverter<ts.RestTypeNode> = {
    kind: [ts.SyntaxKind.RestType],
    convert(context, node) {
        return new RestType(convertType(context, node.type));
    },
    // This is handled in the tuple converter
    convertType: requestBugReport,
};

const namedTupleMemberConverter: TypeConverter<ts.NamedTupleMember> = {
    kind: [ts.SyntaxKind.NamedTupleMember],
    convert(context, node) {
        const innerType = convertType(context, node.type);
        return new NamedTupleMember(
            node.name.getText(),
            !!node.questionToken,
            innerType
        );
    },
    // This ought to be impossible.
    convertType: requestBugReport,
};

// { -readonly [K in string]-?: number}
//   ^ readonlyToken
//              ^ typeParameter
//                   ^^^^^^ typeParameter.constraint
//                          ^ questionToken
//                              ^^^^^^ type
const mappedConverter: TypeConverter<
    ts.MappedTypeNode,
    ts.Type & {
        // Beware! Internal TS API here.
        templateType: ts.Type;
        typeParameter: ts.TypeParameter;
        constraintType: ts.Type;
        nameType?: ts.Type;
    }
> = {
    kind: [ts.SyntaxKind.MappedType],
    convert(context, node) {
        const optionalModifier = kindToModifier(node.questionToken?.kind);
        const templateType = convertType(context, node.type);

        return new MappedType(
            node.typeParameter.name.text,
            convertType(context, node.typeParameter.constraint),
            optionalModifier === "+"
                ? removeUndefined(templateType)
                : templateType,
            kindToModifier(node.readonlyToken?.kind),
            optionalModifier,
            node.nameType ? convertType(context, node.nameType) : void 0
        );
    },
    convertType(context, type, node) {
        // This can happen if a generic function does not have a return type annotated.
        const optionalModifier = kindToModifier(node.questionToken?.kind);
        const templateType = convertType(context, type.templateType);

        return new MappedType(
            type.typeParameter.symbol?.name,
            convertType(context, type.typeParameter.getConstraint()),
            optionalModifier === "+"
                ? removeUndefined(templateType)
                : templateType,
            kindToModifier(node.readonlyToken?.kind),
            optionalModifier,
            type.nameType ? convertType(context, type.nameType) : void 0
        );
    },
};

const literalTypeConverter: TypeConverter<
    ts.LiteralTypeNode,
    ts.LiteralType
> = {
    kind: [ts.SyntaxKind.LiteralType],
    convert(context, node) {
        switch (node.literal.kind) {
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
                return new LiteralType(
                    node.literal.kind === ts.SyntaxKind.TrueKeyword
                );
            case ts.SyntaxKind.StringLiteral:
                return new LiteralType(node.literal.text);
            case ts.SyntaxKind.NumericLiteral:
                return new LiteralType(Number(node.literal.text));
            case ts.SyntaxKind.NullKeyword:
                return new LiteralType(null);
            case ts.SyntaxKind.PrefixUnaryExpression: {
                const operand = (node.literal as ts.PrefixUnaryExpression)
                    .operand;
                switch (operand.kind) {
                    case ts.SyntaxKind.NumericLiteral:
                        return new LiteralType(Number(node.literal.getText()));
                    case ts.SyntaxKind.BigIntLiteral:
                        return new LiteralType(
                            BigInt(node.literal.getText().replace("n", ""))
                        );
                    default:
                        return requestBugReport(context, node.literal);
                }
            }
            case ts.SyntaxKind.BigIntLiteral:
                return new LiteralType(
                    BigInt(node.literal.getText().replace("n", ""))
                );
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                return new LiteralType(node.literal.text);
        }

        return requestBugReport(context, node.literal);
    },
    convertType(_context, type, node) {
        switch (node.literal.kind) {
            case ts.SyntaxKind.StringLiteral:
                return new LiteralType(node.literal.text);
            case ts.SyntaxKind.NumericLiteral:
                return new LiteralType(+node.literal.text);
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
                return new LiteralType(
                    node.literal.kind === ts.SyntaxKind.TrueKeyword
                );
            case ts.SyntaxKind.NullKeyword:
                return new LiteralType(null);
        }

        if (typeof type.value === "object") {
            return new LiteralType(
                BigInt(
                    `${type.value.negative ? "-" : ""}${type.value.base10Value}`
                )
            );
        }

        return new LiteralType(type.value);
    },
};

const templateLiteralConverter: TypeConverter<
    ts.TemplateLiteralTypeNode,
    ts.TemplateLiteralType
> = {
    kind: [ts.SyntaxKind.TemplateLiteralType],
    convert(context, node) {
        return new TemplateLiteralType(
            node.head.text,
            node.templateSpans.map((span) => {
                return [convertType(context, span.type), span.literal.text];
            })
        );
    },
    convertType(context, type) {
        assert(type.texts.length === type.types.length + 1);
        const parts: [Type, string][] = [];
        for (const [a, b] of zip(type.types, type.texts.slice(1))) {
            parts.push([convertType(context, a), b]);
        }

        return new TemplateLiteralType(type.texts[0], parts);
    },
};

const thisConverter: TypeConverter<ts.ThisTypeNode> = {
    kind: [ts.SyntaxKind.ThisType],
    convert() {
        return new IntrinsicType("this");
    },
    convertType() {
        return new IntrinsicType("this");
    },
};

const tupleConverter: TypeConverter<ts.TupleTypeNode, ts.TupleTypeReference> = {
    kind: [ts.SyntaxKind.TupleType],
    convert(context, node) {
        const elements = node.elements.map((node) =>
            convertType(context, node)
        );
        return new TupleType(elements);
    },
    convertType(context, type, node) {
        // We need to do this because of type argument constraints, see GH1449
        const types = type.typeArguments?.slice(0, node.elements.length);
        let elements = types?.map((type) => convertType(context, type));

        if (type.target.labeledElementDeclarations) {
            const namedDeclarations = type.target.labeledElementDeclarations;
            elements = elements?.map(
                (el, i) =>
                    new NamedTupleMember(
                        namedDeclarations[i].name.getText(),
                        !!namedDeclarations[i].questionToken,
                        removeUndefined(el)
                    )
            );
        }

        elements = elements?.map((el, i) => {
            if (type.target.elementFlags[i] & ts.ElementFlags.Variable) {
                // In the node case, we don't need to add the wrapping Array type... but we do here.
                if (el instanceof NamedTupleMember) {
                    return new RestType(
                        new NamedTupleMember(
                            el.name,
                            el.isOptional,
                            new ArrayType(el.element)
                        )
                    );
                }

                return new RestType(new ArrayType(el));
            }

            if (
                type.target.elementFlags[i] & ts.ElementFlags.Optional &&
                !(el instanceof NamedTupleMember)
            ) {
                return new OptionalType(removeUndefined(el));
            }

            return el;
        });

        return new TupleType(elements ?? []);
    },
};

const supportedOperatorNames = {
    [ts.SyntaxKind.KeyOfKeyword]: "keyof",
    [ts.SyntaxKind.UniqueKeyword]: "unique",
    [ts.SyntaxKind.ReadonlyKeyword]: "readonly",
} as const;

const typeOperatorConverter: TypeConverter<ts.TypeOperatorNode> = {
    kind: [ts.SyntaxKind.TypeOperator],
    convert(context, node) {
        return new TypeOperatorType(
            convertType(context, node.type),
            supportedOperatorNames[node.operator]
        );
    },
    convertType(context, type, node) {
        // readonly is only valid on array and tuple literal types.
        if (node.operator === ts.SyntaxKind.ReadonlyKeyword) {
            assert(isObjectType(type));
            const args = context.checker
                .getTypeArguments(type as ts.TypeReference)
                .map((type) => convertType(context, type));
            const inner =
                type.objectFlags & ts.ObjectFlags.Tuple
                    ? new TupleType(args)
                    : new ArrayType(args[0]);

            return new TypeOperatorType(inner, "readonly");
        }

        // keyof will only show up with generic functions, otherwise it gets eagerly
        // resolved to a union of strings.
        if (node.operator === ts.SyntaxKind.KeyOfKeyword) {
            // There's probably an interface for this somewhere... I couldn't find it.
            const targetType = (type as ts.Type & { type: ts.Type }).type;
            return new TypeOperatorType(
                convertType(context, targetType),
                "keyof"
            );
        }

        // TS drops `unique` in `unique symbol` everywhere. If someone used it, we ought
        // to have a type node. This shouldn't ever happen.
        return requestBugReport(context, type);
    },
};

const unionConverter: TypeConverter<ts.UnionTypeNode, ts.UnionType> = {
    kind: [ts.SyntaxKind.UnionType],
    convert(context, node) {
        return new UnionType(
            node.types.map((type) => convertType(context, type))
        );
    },
    convertType(context, type) {
        return new UnionType(
            type.types.map((type) => convertType(context, type))
        );
    },
};

function requestBugReport(context: Context, nodeOrType: ts.Node | ts.Type) {
    if ("kind" in nodeOrType) {
        const kindName = ts.SyntaxKind[nodeOrType.kind];
        const { line, character } = ts.getLineAndCharacterOfPosition(
            nodeOrType.getSourceFile(),
            nodeOrType.pos
        );
        context.logger.warn(
            `Failed to convert type node with kind: ${kindName} and text ${nodeOrType.getText()}. Please report a bug.\n\t` +
                `${nodeOrType.getSourceFile().fileName}:${
                    line + 1
                }:${character}`
        );
        return new UnknownType(nodeOrType.getText());
    } else {
        const typeString = context.checker.typeToString(nodeOrType);
        context.logger.warn(
            `Failed to convert type: ${typeString} when converting ${context.scope.getFullName()}. Please report a bug.`
        );
        return new UnknownType(typeString);
    }
}

function isObjectType(type: ts.Type): type is ts.ObjectType {
    return typeof (type as any).objectFlags === "number";
}

function kindToModifier(
    kind:
        | ts.SyntaxKind.PlusToken
        | ts.SyntaxKind.MinusToken
        | ts.SyntaxKind.ReadonlyKeyword
        | ts.SyntaxKind.QuestionToken
        | undefined
): "+" | "-" | undefined {
    switch (kind) {
        case ts.SyntaxKind.ReadonlyKeyword:
        case ts.SyntaxKind.QuestionToken:
        case ts.SyntaxKind.PlusToken:
            return "+";
        case ts.SyntaxKind.MinusToken:
            return "-";
        default:
            return undefined;
    }
}
