import * as assert from 'assert';
import * as ts from 'typescript';
import { SignatureReflection, ParameterReflection, TypeParameterType } from '../../models';
import { Converter } from '../converter';

export async function convertSignatureDeclaration(converter: Converter, name: string, node: ts.SignatureDeclaration) {
    const signature = converter.checker.getSignatureFromDeclaration(node);
    assert(signature, `Failed to get a signature for ${name}. This likely a bug.`);

    const returnType = await converter.convertTypeOrObject(
        node.type,
        converter.checker.getReturnTypeOfSignature(signature));

    const parameters = await Promise.all(signature.parameters.map(async param => {
        const paramDeclaration = param.valueDeclaration;
        assert(paramDeclaration && ts.isParameter(paramDeclaration)); // Should never fail...

        const paramType = await converter.convertTypeOrObject(
            paramDeclaration.type,
            converter.checker.getTypeOfSymbolAtLocation(param, paramDeclaration));

        const parameter = new ParameterReflection(param.name,
            paramType,
            paramDeclaration.initializer?.getText(),
            !!paramDeclaration.questionToken,
            !!paramDeclaration.dotDotDotToken);

        return parameter;
    }));

    const typeParameters = signature.typeParameters?.map(param => {
        const type = converter.convertType(undefined, param);
        assert(type instanceof TypeParameterType);
        return type;
    }) ?? [];

    return new SignatureReflection(name, returnType, parameters, typeParameters);
}
