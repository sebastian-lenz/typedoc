import * as assert from 'assert';
import * as ts from 'typescript';
import type { ReflectionConverter } from './types';
import { EnumReflection, EnumMemberReflection } from '../../models';

export const enumConverter: ReflectionConverter<ts.EnumDeclaration, EnumReflection> = {
    kind: [ts.SyntaxKind.EnumDeclaration],
    async convert(context, symbol, nodes) {
        const isConst = (symbol.flags & ts.SymbolFlags.ConstEnum) === ts.SymbolFlags.ConstEnum;
        const container = new EnumReflection(symbol.name, isConst);

        await Promise.all(context.getExportsOfKind(symbol, ts.SyntaxKind.EnumMember)
            .map(member => context.converter.convertSymbol(member, context.withContainer(container))));

        return container;
    }
};

export const enumMemberConverter: ReflectionConverter<ts.EnumMember, EnumMemberReflection> = {
    kind: [ts.SyntaxKind.EnumMember],
    convert(context, symbol, [node]) {
        const value = context.checker.getConstantValue(node);
        assert(value !== undefined, 'Failed to get the value of an enum. This is probably a bug.');
        return new EnumMemberReflection(symbol.name, value);
    }
};
