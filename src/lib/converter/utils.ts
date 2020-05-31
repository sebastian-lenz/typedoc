import * as ts from 'typescript';
import * as M from '../models';
import type { Converter } from './converter';

export function convertTypeParameters(converter: Converter, parameters: readonly ts.TypeParameterDeclaration[]): M.TypeParameterType[] {
    return parameters.map(param => {
        const constraint = param.constraint ? converter.convertType(param.constraint) : undefined;
        const defaultValue = param.default ? converter.convertType(param.default) : undefined;

        return new M.TypeParameterType(param.name.text, constraint, defaultValue);
    });
}

export function convertParameters(converter: Converter, parameters: readonly ts.ParameterDeclaration[]): M.SignatureParameterType[] {
    return parameters.map((param, index) => {
        const name = ts.isIdentifier(param.name) ? param.name.text : `param${index}`;
        const type = converter.convertType(param.type, converter.checker.getTypeAtLocation(param));
        return new M.SignatureParameterType(name, hasQuestionToken(param), hasDotDotDotToken(param), type);
    });
}

export function hasReadonlyModifier(declaration?: ts.Declaration) {
    return declaration?.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ReadonlyKeyword) ?? false;
}

export function hasQuestionToken(declaration: ts.Declaration): boolean {
    return !!(declaration as any).questionToken;
}

export function hasDotDotDotToken(declaration: ts.Declaration): boolean {
    return !!(declaration as any).dotDotDotToken;
}
