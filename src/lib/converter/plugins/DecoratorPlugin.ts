import * as ts from "typescript";

import { ReferenceType } from "../../models/types/index";
import type { Reflection, Decorator } from "../../models/reflections/index";
import { Component, ConverterComponent } from "../components";
import { Converter } from "../converter";
import type { Context } from "../context";

/**
 * A plugin that detects decorators.
 */
@Component({ name: "decorator" })
export class DecoratorPlugin extends ConverterComponent {
    /**
     * Defined in this.onBegin
     */
    private readonly usages = new Map<ts.Symbol, ReferenceType[]>();

    /**
     * Create a new ImplementsPlugin instance.
     */
    initialize() {
        this.listenTo(this.owner, {
            [Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
            [Converter.EVENT_CREATE_PARAMETER]: this.onDeclaration,
            [Converter.EVENT_RESOLVE]: this.onBeginResolve,
            [Converter.EVENT_END]: () => this.usages.clear(),
        });
    }

    /**
     * Create an object describing the arguments a decorator is set with.
     *
     * @param args  The arguments resolved from the decorator's call expression.
     * @param signature  The signature definition of the decorator being used.
     * @returns An object describing the decorator parameters,
     */
    private extractArguments(
        args: ts.NodeArray<ts.Expression>,
        signature: ts.Signature
    ): { [name: string]: string | string[] } {
        const result: any = {};
        args.forEach((arg: ts.Expression, index: number) => {
            if (index < signature.parameters.length) {
                const parameter = signature.parameters[index];
                result[parameter.name] = arg.getText();
            } else {
                if (!result["..."]) {
                    result["..."] = [];
                }
                result["..."].push(arg.getText());
            }
        });

        return result;
    }

    /**
     * Triggered when the converter has created a declaration or signature reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently processed.
     * @param node  The node that is currently processed if available.
     */
    private onDeclaration(
        context: Context,
        reflection: Reflection,
        node?: ts.Node
    ) {
        node?.decorators?.forEach((decorator) => {
            let callExpression: ts.CallExpression | undefined;
            let identifier: ts.Expression;

            switch (decorator.expression.kind) {
                case ts.SyntaxKind.Identifier:
                    identifier = decorator.expression;
                    break;
                case ts.SyntaxKind.CallExpression:
                    callExpression = <ts.CallExpression>decorator.expression;
                    identifier = callExpression.expression;
                    break;
                default:
                    return;
            }

            const info: Decorator = {
                name: identifier.getText(),
            };

            const type = context.checker.getTypeAtLocation(identifier);
            if (type && type.symbol) {
                info.type = new ReferenceType(
                    info.name,
                    context.resolveAliasedSymbol(type.symbol),
                    context.project
                );

                if (callExpression && callExpression.arguments) {
                    const signature = context.checker.getResolvedSignature(
                        callExpression
                    );
                    if (signature) {
                        info.arguments = this.extractArguments(
                            callExpression.arguments,
                            signature
                        );
                    }
                }

                const usages = this.usages.get(type.symbol) ?? [];
                usages.push(
                    new ReferenceType(
                        reflection.name,
                        reflection,
                        context.project
                    )
                );
                this.usages.set(type.symbol, usages);
            }

            reflection.decorators ??= [];
            reflection.decorators.push(info);
        });
    }

    private onBeginResolve(context: Context) {
        for (const [symbol, ref] of this.usages) {
            const reflection = context.project.getReflectionFromSymbol(symbol);
            if (reflection) {
                reflection.decorates = ref;
            }
        }
    }
}
