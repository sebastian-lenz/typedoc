import * as ts from 'typescript';

import { ContainerReflection, DeclarationReflection, ReflectionFlag, ReflectionKind } from '../../models/index';
import { Context } from '../context';
import { Converter } from '../converter';
import { getRawComment } from './comment.js';
import { createReferenceType } from './reference';

/**
 * List of reflection kinds that never should be static.
 */
const nonStaticKinds = [
    ReflectionKind.Class,
    ReflectionKind.Interface,
    ReflectionKind.Namespace
];

/**
 * List of ts kinds leading to none static merge.
 */
const nonStaticMergeKinds = [
    ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.ClassExpression,
    ts.SyntaxKind.InterfaceDeclaration
];

const builtInSymbolRegExp = /^__@(\w+)$/;

/**
 * Create a declaration reflection from the given TypeScript node.
 *
 * @param context  The context object describing the current state the converter is in. The
 *   scope of the context will be the parent of the generated reflection.
 * @param node  The TypeScript node that should be converted to a reflection.
 * @param kind  The desired kind of the reflection.
 * @param name  The desired name of the reflection.
 * @returns The resulting reflection or undefined if an error is encountered.
 */
export function createDeclaration(context: Context, node: ts.Declaration, kind: ReflectionKind, name?: string): DeclarationReflection | undefined {
    if (!(context.scope instanceof ContainerReflection)) {
        throw new Error('Expected container reflection.');
    }
    const container = context.scope;

    // Ensure we have a name for the reflection
    if (!name) {
        if (node.localSymbol) {
            name = node.localSymbol.name;
        } else if (node.symbol) {
            name = node.symbol.name;
        } else {
            return;
        }

        // rename built-in symbols
        const match = builtInSymbolRegExp.exec(name);
        if (match) {
            name = `[Symbol.${match[1]}]`;
        } else if (kind & (ReflectionKind.ClassMember | ReflectionKind.VariableOrProperty) && name === '__computed') {
            // rename computed properties
            const declName = ts.getNameOfDeclaration(node);
            const symbol = declName && context.checker.getSymbolAtLocation(declName);
            if (symbol) {
                name = context.checker.symbolToString(symbol, /*enclosingDeclaration*/ undefined, ts.SymbolFlags.ClassMember);
            } else if (declName) {
                name = declName.getText();
            }
        }
    }

    const modifiers = ts.getCombinedModifierFlags(node);

    let hasComment: boolean = Boolean(getRawComment(node));
    // Test whether the node is exported
    let isExported: boolean;
    if (kind === ReflectionKind.Module || kind === ReflectionKind.Global) {
        isExported = true;
        hasComment = true;
    } else if (container.kind === ReflectionKind.Global) {
        // In file mode, everything is exported.
        isExported = true;
    } else if (container.kindOf([ReflectionKind.Namespace, ReflectionKind.Module])) {
        const symbol = context.getSymbolAtLocation(node);
        if (!symbol) {
            isExported = false;
        } else {
            let parentNode = node.parent;
            while (![ts.SyntaxKind.SourceFile, ts.SyntaxKind.ModuleDeclaration].includes(parentNode.kind)) {
                parentNode = parentNode.parent;
            }
            const parentSymbol = context.getSymbolAtLocation(parentNode);
            if (!parentSymbol) {
                // This is a file with no imports/exports, so everything is
                // global and therefore exported.
                isExported = true;
            } else {
                isExported = !!parentSymbol.exports?.get(symbol.escapedName);
            }
        }
    } else {
        isExported = container.flags.isExported;
    }

    if (
        (!isExported && context.converter.excludeNotExported)
        ||
        (context.converter.excludeNotDocumented && kind !== ReflectionKind.EnumMember && !hasComment)
    ) {
        return;
    }

    // Test whether the node is private, when inheriting ignore private members
    const isPrivate = !!(modifiers & ts.ModifierFlags.Private);
    if (context.isInherit && isPrivate) {
        return;
    }

    // Test whether the node is static, when merging a module to a class make the node static
    let isConstructorProperty = false;
    let isStatic = false;
    if (!nonStaticKinds.includes(kind)) {
        isStatic = !!(modifiers & ts.ModifierFlags.Static);
        if (container.kind === ReflectionKind.Class) {
            if (node.parent && node.parent.kind === ts.SyntaxKind.Constructor) {
                isConstructorProperty = true;
            } else if (!node.parent || !nonStaticMergeKinds.includes(node.parent.kind)) {
                isStatic = true;
            }
        }
    }

    // Check if we already have a child of the same kind, with the same name and static flag
    let child: DeclarationReflection | undefined;
    const children = container.children = container.children || [];
    children.forEach((n: DeclarationReflection) => {
        if (n.name === name && n.flags.isStatic === isStatic && canMergeReflectionsByKind(n.kind, kind)) {
            child = n;
        }
    });

    if (!child) {
        // Child does not exist, create a new reflection
        child = new DeclarationReflection(name, kind, container);
        child.setFlag(ReflectionFlag.Static, isStatic);
        child.setFlag(ReflectionFlag.Private, isPrivate);
        child.setFlag(ReflectionFlag.ConstructorProperty, isConstructorProperty);
        child.setFlag(ReflectionFlag.Exported,  isExported);
        child = setupDeclaration(context, child, node);

        if (child) {
            children.push(child);
            context.registerReflection(child, context.getSymbolAtLocation(node) ?? node.symbol);
        }
    } else {
        // Merge the existent reflection with the given node
        child = mergeDeclarations(context, child, node, kind);
    }

    // If we have a reflection, trigger the corresponding event
    if (child) {
        context.trigger(Converter.EVENT_CREATE_DECLARATION, child, node);
    }

    return child;
}

/**
 * Setup a newly created declaration reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param reflection  The newly created blank reflection.
 * @param node  The TypeScript node whose properties should be applies to the given reflection.
 * @returns The reflection populated with the values of the given node.
 */
function setupDeclaration(context: Context, reflection: DeclarationReflection, node: ts.Declaration) {
    const modifiers = ts.getCombinedModifierFlags(node);

    reflection.setFlag(ReflectionFlag.External,  context.isExternal);
    reflection.setFlag(ReflectionFlag.Protected, !!(modifiers & ts.ModifierFlags.Protected));
    reflection.setFlag(ReflectionFlag.Public,    !!(modifiers & ts.ModifierFlags.Public));
    reflection.setFlag(ReflectionFlag.Optional,  !!(node['questionToken']));
    reflection.setFlag(ReflectionFlag.Readonly,  !!(modifiers & ts.ModifierFlags.Readonly));

    if (
        context.isInherit &&
        (node.parent === context.inheritParent || reflection.flags.isConstructorProperty)
    ) {
        if (!reflection.inheritedFrom) {
            reflection.inheritedFrom = createReferenceType(context, node.symbol, true);
            reflection.getAllSignatures().forEach((signature) => {
                signature.inheritedFrom = createReferenceType(context, node.symbol, true);
            });
        }
    }

    return reflection;
}

// we should not be merging type and value with the same name,
// because TypeScript has different namespaces for these two categories
function canMergeReflectionsByKind(kind1: ReflectionKind, kind2: ReflectionKind): boolean {
    if (
        (kind1 & ReflectionKind.SomeType && kind2 & ReflectionKind.SomeValue)
        ||
        (kind2 & ReflectionKind.SomeType && kind1 & ReflectionKind.SomeValue)
    ) {
        return false;
    }

    return true;
}

/**
 * Merge the properties of the given TypeScript node with the pre existent reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param reflection  The pre existent reflection.
 * @param node  The TypeScript node whose properties should be merged with the given reflection.
 * @param kind  The desired kind of the reflection.
 * @returns The reflection merged with the values of the given node or NULL if the merge is invalid.
 */
function mergeDeclarations(context: Context, reflection: DeclarationReflection, node: ts.Node, kind: ReflectionKind) {
    if (reflection.kind !== kind) {
        const weights = [ReflectionKind.Namespace, ReflectionKind.Enum, ReflectionKind.Class];
        const kindWeight = weights.indexOf(kind);
        const childKindWeight = weights.indexOf(reflection.kind);
        if (kindWeight > childKindWeight) {
            reflection.kind = kind;
        }
    }

    if (
        context.isInherit &&
        (context.inherited || []).includes(reflection.name) &&
        (node.parent === context.inheritParent || reflection.flags.isConstructorProperty)
    ) {
        if (!reflection.overwrites) {
            reflection.overwrites = createReferenceType(context, node.symbol, true);
            reflection.getAllSignatures().forEach((signature) => {
                signature.overwrites = createReferenceType(context, node.symbol, true);
            });
        }
        return;
    }

    return reflection;
}
