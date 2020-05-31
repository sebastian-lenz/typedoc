import * as ts from 'typescript';
import type { ReflectionConverter } from './types';
import { VariableReflection, ReflectionFlag } from '../../models';

export const variableConverter: ReflectionConverter<ts.VariableDeclaration, VariableReflection> = {
    kind: [ts.SyntaxKind.VariableDeclaration],
    async convert(context, symbol, [node]) {
        const defaultValue = node.initializer?.getText();

        const reflection = new VariableReflection(symbol.name,
            context.converter.convertType(node.type, context.checker.getTypeOfSymbolAtLocation(symbol, node)),
            defaultValue);

        if (node.flags & ts.NodeFlags.Let) {
            reflection.flags.setFlag(ReflectionFlag.Let, true);
        }
        if (node.flags & ts.NodeFlags.Const) {
            reflection.flags.setFlag(ReflectionFlag.Const, true);
        }

        return reflection;
    }
}
