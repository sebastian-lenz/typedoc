// Converter functions for JSDoc defined types
// @typedef
// @callback

import { ok } from "assert";
import * as ts from "typescript";
import {
    DeclarationReflection,
    IntrinsicType,
    ReflectionKind,
    ReflectionType,
    SignatureReflection,
} from "../models";
import { flatMap } from "../utils/array";
import { Context } from "./context";
import { ConverterEvents } from "./converter-events";
import {
    convertParameterNodes,
    convertTypeParameterNodes,
} from "./factories/signature";

export function convertJsDocAlias(
    context: Context,
    symbol: ts.Symbol,
    declaration: ts.JSDocTypedefTag | ts.JSDocEnumTag,
    nameOverride?: string
) {
    if (
        declaration.typeExpression &&
        ts.isJSDocTypeLiteral(declaration.typeExpression)
    ) {
        convertJsDocInterface(context, declaration, symbol, nameOverride);
        return;
    }

    const reflection = context.createDeclarationReflection(
        ReflectionKind.TypeAlias,
        symbol,
        nameOverride
    );

    reflection.type = context.converter.convertType(
        context.withScope(reflection),
        declaration.typeExpression?.type
    );

    convertTemplateParameters(
        context.withScope(reflection),
        declaration.parent
    );
}

export function convertJsDocCallback(
    context: Context,
    symbol: ts.Symbol,
    declaration: ts.JSDocCallbackTag,
    nameOverride?: string
) {
    const alias = context.createDeclarationReflection(
        ReflectionKind.TypeAlias,
        symbol,
        nameOverride
    );
    const ac = context.withScope(alias);

    alias.type = convertJsDocSignature(ac, declaration.typeExpression);
    convertTemplateParameters(ac, declaration.parent);
}

function convertJsDocInterface(
    context: Context,
    declaration: ts.JSDocTypedefTag | ts.JSDocEnumTag,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const reflection = context.createDeclarationReflection(
        ReflectionKind.Interface,
        symbol,
        nameOverride
    );
    const rc = context.withScope(reflection);

    const type = context.checker.getDeclaredTypeOfSymbol(symbol);
    for (const s of type.getProperties()) {
        context.converter.convertSymbol(rc, s);
    }

    convertTemplateParameters(rc, declaration.parent);
}

function convertJsDocSignature(context: Context, node: ts.JSDocSignature) {
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
    context.registerReflection(reflection, symbol);
    context.trigger(ConverterEvents.CREATE_DECLARATION, reflection, node);

    const signature = new SignatureReflection(
        "__type",
        ReflectionKind.CallSignature,
        reflection
    );
    context.registerReflection(signature, void 0);
    const signatureCtx = context.withScope(signature);

    reflection.signatures = [signature];
    signature.type = context.converter.convertType(
        signatureCtx,
        node.type?.typeExpression?.type
    );
    signature.parameters = convertParameterNodes(
        signatureCtx,
        signature,
        node.parameters
    );
    signature.typeParameters = convertTemplateParameterNodes(
        context.withScope(reflection),
        node.typeParameters
    );

    return new ReflectionType(reflection);
}

function convertTemplateParameters(context: Context, node: ts.JSDoc) {
    ok(context.scope instanceof DeclarationReflection);
    context.scope.typeParameters = convertTemplateParameterNodes(
        context,
        node.tags?.filter(ts.isJSDocTemplateTag)
    );
}

function convertTemplateParameterNodes(
    context: Context,
    nodes: readonly ts.JSDocTemplateTag[] | undefined
) {
    const params = flatMap(nodes ?? [], (tag) => tag.typeParameters);
    return convertTypeParameterNodes(context, params);
}
