import * as ts from 'typescript';

import { Reflection, ReflectionKind, ReflectionFlag } from '../../models/index';
import { createDeclaration } from '../factories/index';
import { Context } from '../context';
import { Component, ConverterNodeComponent } from '../components';

const preferred: ts.SyntaxKind[] = [
    ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.InterfaceDeclaration,
    ts.SyntaxKind.EnumDeclaration
];

@Component({name: 'node:block'})
export class BlockConverter extends ConverterNodeComponent<ts.SourceFile|ts.Block|ts.ModuleBlock> {
    /**
     * List of supported TypeScript syntax kinds.
     */
    supports: ts.SyntaxKind[] = [
        ts.SyntaxKind.Block,
        ts.SyntaxKind.ModuleBlock,
        ts.SyntaxKind.SourceFile
    ];

    /**
     * Analyze the given class declaration node and create a suitable reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param node     The class declaration node that should be analyzed.
     * @return The resulting reflection or NULL.
     */
    convert(context: Context, node: ts.SourceFile|ts.Block|ts.ModuleBlock): Reflection {
        if (node.kind === ts.SyntaxKind.SourceFile) {
            this.convertSourceFile(context, node);
        } else {
            this.convertStatements(context, node);
        }

        return context.scope;
    }

    /**
     * Analyze the given source file node and create a suitable reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param node     The source file node that should be analyzed.
     * @return The resulting reflection or NULL.
     */
    private convertSourceFile(context: Context, node: ts.SourceFile): Reflection | undefined {
        let result: Reflection | undefined = context.scope;

        context.withSourceFile(node, () => {
            result = createDeclaration(context, node, ReflectionKind.Module, node.fileName);
            context.withScope(result, () => {
                this.convertStatements(context, node);
                result!.setFlag(ReflectionFlag.Exported);
            });
        });

        return result;
    }

    private convertStatements(context: Context, node: ts.SourceFile|ts.Block|ts.ModuleBlock) {
        if (node.statements) {
            const statements: ts.Statement[] = [];

            node.statements.forEach((statement) => {
                if (preferred.includes(statement.kind)) {
                    this.owner.convertNode(context, statement);
                } else {
                    statements.push(statement);
                }
            });

            statements.forEach((statement) => {
                this.owner.convertNode(context, statement);
            });
        }
    }
}
