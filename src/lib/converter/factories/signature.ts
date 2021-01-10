import * as ts from "typescript";
import * as assert from "assert";
import {
    DeclarationReflection,
    ParameterReflection,
    PredicateType,
    Reflection,
    ReflectionFlag,
    ReflectionKind,
    SignatureReflection,
    TypeParameterReflection,
} from "../../models";
import { Context } from "../context";
import { ConverterEvents } from "../converter-events";
import { convertDefaultValue } from "../convert-expression";
import { removeUndefined } from "../utils/reflections";

export function createSignature(
    context: Context,
    kind:
        | ReflectionKind.CallSignature
        | ReflectionKind.ConstructorSignature
        | ReflectionKind.GetSignature
        | ReflectionKind.SetSignature,
    signature: ts.Signature,
    declaration?: ts.SignatureDeclaration,
    commentDeclaration?: ts.Node
) {
    assert(context.scope instanceof DeclarationReflection);
    // signature.getDeclaration might return undefined.
    // https://github.com/microsoft/TypeScript/issues/30014
    declaration ??= signature.getDeclaration() as
        | ts.SignatureDeclaration
        | undefined;

    if (
        !commentDeclaration &&
        declaration &&
        (ts.isArrowFunction(declaration) ||
            ts.isFunctionExpression(declaration))
    ) {
        commentDeclaration = declaration.parent;
    }
    commentDeclaration ??= declaration;

    const sigRef = new SignatureReflection(
        context.scope.name,
        kind,
        context.scope
    );

    sigRef.typeParameters = convertTypeParameters(
        context,
        sigRef,
        signature.typeParameters
    );

    sigRef.parameters = convertParameters(
        context,
        sigRef,
        signature.parameters as readonly (ts.Symbol & { type: ts.Type })[],
        declaration?.parameters
    );

    const predicate = context.checker.getTypePredicateOfSignature(signature);
    if (predicate) {
        sigRef.type = convertPredicate(predicate, context.withScope(sigRef));
    } else {
        sigRef.type = context.converter.convertType(
            context.withScope(sigRef),
            (declaration?.kind === ts.SyntaxKind.FunctionDeclaration &&
                declaration.type) ||
                signature.getReturnType()
        );
    }

    context.registerReflection(sigRef, undefined);
    context.trigger(
        ConverterEvents.CREATE_SIGNATURE,
        sigRef,
        commentDeclaration
    );
    return sigRef;
}

function convertParameters(
    context: Context,
    sigRef: SignatureReflection,
    parameters: readonly (ts.Symbol & { type: ts.Type })[],
    parameterNodes: readonly ts.ParameterDeclaration[] | undefined
) {
    return parameters.map((param, i) => {
        const declaration = param.valueDeclaration as
            | ts.Declaration
            | undefined;
        assert(
            !declaration ||
                ts.isParameter(declaration) ||
                ts.isJSDocParameterTag(declaration)
        );
        const paramRefl = new ParameterReflection(
            /__\d+/.test(param.name) ? "__namedParameters" : param.name,
            ReflectionKind.Parameter,
            sigRef
        );
        context.registerReflection(paramRefl, param);
        context.trigger(
            ConverterEvents.CREATE_PARAMETER,
            paramRefl,
            declaration
        );

        let type: ts.Type | ts.TypeNode;
        if (
            declaration &&
            ts.isParameter(declaration) &&
            ts.isFunctionDeclaration(declaration.parent) &&
            declaration.type
        ) {
            type = declaration.type;
        } else if (declaration) {
            type = context.checker.getTypeOfSymbolAtLocation(
                param,
                declaration
            );
        } else {
            type = param.type;
        }

        paramRefl.type = context.converter.convertType(
            context.withScope(paramRefl),
            type
        );

        let isOptional = false;
        if (declaration) {
            isOptional = ts.isParameter(declaration)
                ? !!declaration.questionToken
                : declaration.isBracketed;
        }

        if (isOptional) {
            paramRefl.type = removeUndefined(paramRefl.type);
        }

        paramRefl.defaultValue = convertDefaultValue(parameterNodes?.[i]);
        paramRefl.setFlag(ReflectionFlag.Optional, isOptional);

        // If we have no declaration, then this is an implicitly defined parameter in JS land
        // because the method body uses `arguments`... which is always a rest argument
        let isRest = true;
        if (declaration) {
            isRest = ts.isParameter(declaration)
                ? !!declaration.dotDotDotToken
                : !!declaration.typeExpression &&
                  ts.isJSDocVariadicType(declaration.typeExpression.type);
        }

        paramRefl.setFlag(ReflectionFlag.Rest, isRest);
        return paramRefl;
    });
}

export function convertParameterNodes(
    context: Context,
    sigRef: SignatureReflection,
    parameters: readonly (ts.JSDocParameterTag | ts.ParameterDeclaration)[]
) {
    return parameters.map((param) => {
        const paramRefl = new ParameterReflection(
            /__\d+/.test(param.name.getText())
                ? "__namedParameters"
                : param.name.getText(),
            ReflectionKind.Parameter,
            sigRef
        );
        context.registerReflection(
            paramRefl,
            context.getSymbolAtLocation(param)
        );

        paramRefl.type = context.converter.convertType(
            context.withScope(paramRefl),
            ts.isParameter(param) ? param.type : param.typeExpression?.type
        );

        const isOptional = ts.isParameter(param)
            ? !!param.questionToken
            : param.isBracketed;
        if (isOptional) {
            paramRefl.type = removeUndefined(paramRefl.type);
        }

        paramRefl.defaultValue = convertDefaultValue(param);
        paramRefl.setFlag(ReflectionFlag.Optional, isOptional);
        paramRefl.setFlag(
            ReflectionFlag.Rest,
            ts.isParameter(param)
                ? !!param.dotDotDotToken
                : !!param.typeExpression &&
                      ts.isJSDocVariadicType(param.typeExpression.type)
        );
        return paramRefl;
    });
}

function convertTypeParameters(
    context: Context,
    parent: Reflection,
    parameters: readonly ts.TypeParameter[] | undefined
) {
    return parameters?.map((param) => {
        const constraintT = param.getConstraint();
        const defaultT = param.getDefault();

        const constraint = constraintT
            ? context.converter.convertType(context, constraintT)
            : void 0;
        const defaultType = defaultT
            ? context.converter.convertType(context, defaultT)
            : void 0;
        const paramRefl = new TypeParameterReflection(
            param.symbol.name,
            constraint,
            defaultType,
            parent
        );
        context.registerReflection(paramRefl, undefined);
        context.trigger(ConverterEvents.CREATE_TYPE_PARAMETER, paramRefl);

        return paramRefl;
    });
}

export function convertTypeParameterNodes(
    context: Context,
    parameters: readonly ts.TypeParameterDeclaration[] | undefined
) {
    return parameters?.map((param) => {
        const constraint = param.constraint
            ? context.converter.convertType(context, param.constraint)
            : void 0;
        const defaultType = param.default
            ? context.converter.convertType(context, param.default)
            : void 0;
        const paramRefl = new TypeParameterReflection(
            param.name.text,
            constraint,
            defaultType,
            context.scope
        );
        context.registerReflection(paramRefl, undefined);
        context.trigger(
            ConverterEvents.CREATE_TYPE_PARAMETER,
            paramRefl,
            param
        );

        return paramRefl;
    });
}

function convertPredicate(
    predicate: ts.TypePredicate,
    context: Context
): PredicateType {
    let name: string;
    switch (predicate.kind) {
        case ts.TypePredicateKind.This:
        case ts.TypePredicateKind.AssertsThis:
            name = "this";
            break;
        case ts.TypePredicateKind.Identifier:
        case ts.TypePredicateKind.AssertsIdentifier:
            name = predicate.parameterName;
            break;
    }

    let asserts: boolean;
    switch (predicate.kind) {
        case ts.TypePredicateKind.This:
        case ts.TypePredicateKind.Identifier:
            asserts = false;
            break;
        case ts.TypePredicateKind.AssertsThis:
        case ts.TypePredicateKind.AssertsIdentifier:
            asserts = true;
            break;
    }

    return new PredicateType(
        name,
        asserts,
        predicate.type
            ? context.converter.convertType(context, predicate.type)
            : void 0
    );
}
