import * as ts from 'typescript';

import { Type, IntrinsicType, ReflectionType } from '../../models/types/index';
import { ReflectionKind, DeclarationReflection } from '../../models/reflections/index';
import { createReferenceType } from '../factories/index';
import { Component, ConverterTypeComponent, TypeNodeConverter } from '../components';
import { Context } from '../context';
import { Converter } from '../converter';

@Component({name: 'type:reference'})
export class ReferenceConverter extends ConverterTypeComponent implements TypeNodeConverter<ts.TypeReference, ts.TypeReferenceNode> {
    /**
     * The priority this converter should be executed with.
     * A higher priority means the converter will be applied earlier.
     */
    priority = -50;

    /**
     * Test whether this converter can handle the given TypeScript node.
     */
    supportsNode(context: Context, node: ts.TypeReferenceNode, type: ts.TypeReference): boolean {
        return !!(type.flags & ts.TypeFlags.Object);
    }

    /**
     * Test whether this converter can handle the given TypeScript type.
     */
    supportsType(context: Context, type: ts.TypeReference): boolean {
        return !!(type.flags & ts.TypeFlags.Object);
    }

    /**
     * Convert the type reference node to its type reflection.
     *
     * This is a node based converter, see [[convertTypeReferenceType]] for the type equivalent.
     *
     * ```
     * class SomeClass { }
     * let someValue: SomeClass;
     * ```
     *
     * @param context  The context object describing the current state the converter is in.
     * @param node  The type reference node that should be converted.
     * @param type  The type of the type reference node.
     * @returns The type reflection representing the given reference node.
     */
    convertNode(context: Context, node: ts.TypeReferenceNode, type: ts.TypeReference): Type | undefined {
        if (!type.symbol) {
            return new IntrinsicType('Object');
        } else if (type.symbol.declarations && (type.symbol.flags & ts.SymbolFlags.TypeLiteral || type.symbol.flags & ts.SymbolFlags.ObjectLiteral)) {
            return this.convertLiteral(context, type.symbol, node);
        }

        const result = createReferenceType(context, type.symbol);
        if (result && node.typeArguments) {
            result.typeArguments = this.owner.convertTypes(context, node.typeArguments);
        }

        return result;
    }

    /**
     * Convert the given type reference to its type reflection.
     *
     * This is a type based converter, see [[convertTypeReference]] for the node equivalent.
     *
     * ```
     * class SomeClass { }
     * let someValue: SomeClass;
     * ```
     *
     * @param context  The context object describing the current state the converter is in.
     * @param type  The type reference that should be converted.
     * @returns The type reflection representing the given type reference.
     */
    convertType(context: Context, type: ts.TypeReference): Type | undefined {
        if (!type.symbol) {
            return new IntrinsicType('Object');
        } else if (type.symbol.declarations && (type.symbol.flags & ts.SymbolFlags.TypeLiteral || type.symbol.flags & ts.SymbolFlags.ObjectLiteral)) {
            return this.convertLiteral(context, type.symbol);
        }

        const result = createReferenceType(context, type.symbol);
        if (result && type.typeArguments) {
            result.typeArguments = this.owner.convertTypes(context, undefined, type.typeArguments);
        }

        return result;
    }

    /**
     * Create a type literal reflection.
     *
     * This is a utility function used by [[convertTypeReferenceNode]] and
     * [[convertTypeReferenceType]] when encountering an object or type literal.
     *
     * A type literal is explicitly set:
     * ```
     * let someValue: {a: string; b: number;};
     * ```
     *
     * An object literal types are usually reflected by the TypeScript compiler:
     * ```
     * function someFunction() { return {a: 'Test', b: 1024}; }
     * ```
     *
     * @param context  The context object describing the current state the converter is in.
     * @param symbol  The symbol describing the type literal.
     * @param node  If known the node which produced the type literal. Type literals that are
     *   implicitly generated by TypeScript won't have a corresponding node.
     * @returns A type reflection representing the given type literal.
     */
    private convertLiteral(context: Context, symbol: ts.Symbol, node?: ts.Node): Type | undefined {
        for (const declaration of symbol.declarations) {
            if (context.visitStack.includes(declaration)) {
                if (declaration.kind === ts.SyntaxKind.TypeLiteral ||
                        declaration.kind === ts.SyntaxKind.ObjectLiteralExpression) {
                    // TODO: Check if this type assertion is safe and document.
                    return createReferenceType(context, declaration.parent.symbol!);
                } else {
                    // TODO: Check if this type assertion is safe and document.
                    return createReferenceType(context, declaration.symbol!);
                }
            }
        }

        const declaration = new DeclarationReflection('__type', ReflectionKind.TypeLiteral, context.scope);

        context.registerReflection(declaration, undefined, symbol);
        context.trigger(Converter.EVENT_CREATE_DECLARATION, declaration, node);
        context.withScope(declaration, () => {
            symbol.declarations.forEach((node) => {
                this.owner.convertNode(context, node);
            });
        });

        return new ReflectionType(declaration);
    }
}
