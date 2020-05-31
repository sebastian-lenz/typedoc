import * as ts from 'typescript';
import type { ReflectionConverter } from './types';
import { MethodReflection } from '../../models';
import { convertSignatureDeclaration } from './signature';

export const methodConverter: ReflectionConverter<ts.MethodSignature | ts.MethodDeclaration, MethodReflection> = {
    kind: [ts.SyntaxKind.MethodSignature, ts.SyntaxKind.MethodDeclaration],
    async convert(context, symbol, nodes) {
        const container = new MethodReflection(symbol.name);

        // With overloads, only the signatures without an implementation are "real"
        const skipImplementation = nodes.length > 1;

        for (const node of nodes) {
            if (ts.isMethodDeclaration(node) && node.body && skipImplementation) continue;
            container.signatures.push(await convertSignatureDeclaration(context.converter, symbol.name, node));
        }

        return container;
    }
}
