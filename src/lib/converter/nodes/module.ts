import * as ts from 'typescript';

import { Reflection, ReflectionKind, DeclarationReflection } from '../../models/index';
import { createDeclaration } from '../factories/index';
import { Context } from '../context';
import { Component, ConverterNodeComponent } from '../components';

@Component({name: 'node:module'})
export class ModuleConverter extends ConverterNodeComponent<ts.ModuleDeclaration> {
    /**
     * List of supported TypeScript syntax kinds.
     */
    supports: ts.SyntaxKind[] = [
        ts.SyntaxKind.ModuleDeclaration
    ];

    /**
     * Analyze the given module node and create a suitable reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param node     The module node that should be analyzed.
     * @return The resulting reflection or NULL.
     */
    convert(context: Context, node: ts.ModuleDeclaration): Reflection | undefined {
        const reflection = context.isInherit && context.inheritParent === node
            ? <DeclarationReflection> context.scope
            : createDeclaration(context, node, node.name.kind === ts.SyntaxKind.StringLiteral
                ? ReflectionKind.Module
                : ReflectionKind.Namespace);
        context.withScope(reflection, () => {
            if (node.body) {
                this.owner.convertNode(context, node.body);
            }
        });
        return reflection;
    }
}
