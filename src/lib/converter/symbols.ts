import * as assert from "assert";
import * as ts from "typescript";
import {
    DeclarationReflection,
    ReferenceReflection,
    Reflection,
    ReflectionFlag,
    ReflectionKind,
    TypeParameterReflection,
} from "../models";
import { flatMap, uniqueByEquals, zip } from "../utils/array";
import { getEnumFlags, hasFlag, removeFlag } from "../utils/enum";
import { Context } from "./context";
import { convertDefaultValue } from "./convert-expression";
import { ConverterEvents } from "./converter-events";
import { convertIndexSignature } from "./factories/index-signature";
import { createSignature } from "./factories/signature";

function getSymbolExportsWithFlag(symbol: ts.Symbol, flag: ts.SymbolFlags) {
    const childSymbols: ts.Symbol[] = [];

    symbol.exports?.forEach((child) => {
        if (child.flags & flag) {
            childSymbols.push(child);
        }
    });

    return childSymbols;
}

const symbolConverters: {
    [K in ts.SymbolFlags]?: (
        context: Context,
        symbol: ts.Symbol,
        nameOverride?: string
    ) => void;
} = {
    [ts.SymbolFlags.RegularEnum]: convertEnum,
    [ts.SymbolFlags.ConstEnum]: convertEnum,
    [ts.SymbolFlags.EnumMember]: convertEnumMember,
    [ts.SymbolFlags.ValueModule]: convertNamespace,
    [ts.SymbolFlags.NamespaceModule]: convertNamespace,
    [ts.SymbolFlags.TypeAlias]: convertTypeAlias,
    [ts.SymbolFlags.Function]: convertFunctionOrMethod,
    [ts.SymbolFlags.Method]: convertFunctionOrMethod,
    [ts.SymbolFlags.Interface]: convertClassOrInterface,
    [ts.SymbolFlags.Property]: convertProperty,
    [ts.SymbolFlags.Class]: convertClassOrInterface,
    [ts.SymbolFlags.Constructor]: convertConstructor,
    [ts.SymbolFlags.Alias]: convertAlias,
    [ts.SymbolFlags.BlockScopedVariable]: convertVariable,
    [ts.SymbolFlags.FunctionScopedVariable]: convertVariable,
    [ts.SymbolFlags.GetAccessor]: convertAccessor,
    [ts.SymbolFlags.SetAccessor]: convertAccessor,
};

// Sanity check, if this fails a dev messed up.
for (const key of Object.keys(symbolConverters)) {
    if (!Number.isInteger(Math.log2(+key))) {
        throw new Error(
            `Symbol converter for key ${
                ts.SymbolFlags[+key]
            } does not specify a valid flag value.`
        );
    }
}

export function convertSymbol(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
): void {
    if (context.shouldIgnore(symbol)) {
        return;
    }

    let flags = removeFlag(
        symbol.flags,
        ts.SymbolFlags.Transient |
            ts.SymbolFlags.Assignment |
            ts.SymbolFlags.Optional |
            ts.SymbolFlags.Prototype
    );

    // Declaration merging - the only type (excluding enum/enum, ns/ns, etc)
    // that TD supports is merging a class and interface. All others are
    // represented as multiple reflections
    if (hasFlag(symbol.flags, ts.SymbolFlags.Class)) {
        flags = removeFlag(flags, ts.SymbolFlags.Interface);
    }

    // Kind of declaration merging... we treat this as a property with get/set signatures.
    if (hasFlag(symbol.flags, ts.SymbolFlags.GetAccessor)) {
        flags = removeFlag(flags, ts.SymbolFlags.SetAccessor);
    }

    if (hasFlag(symbol.flags, ts.SymbolFlags.NamespaceModule)) {
        // This might be here if a namespace is declared several times.
        flags = removeFlag(flags, ts.SymbolFlags.ValueModule);
    }

    for (const flag of getEnumFlags(flags)) {
        if (!(flag in symbolConverters)) {
            context.logger.verbose(
                `Missing converter for symbol: ${symbol.name} with flag ${ts.SymbolFlags[flag]}`
            );
        }
        symbolConverters[flag]?.(context, symbol, nameOverride);
    }
}

function convertSymbols(context: Context, symbols: readonly ts.Symbol[]) {
    for (const symbol of symbols) {
        convertSymbol(context, symbol);
    }
}

function convertEnum(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const reflection = context.createDeclarationReflection(
        ReflectionKind.Enum,
        symbol,
        nameOverride
    );

    convertSymbols(
        context.withScope(reflection),
        getSymbolExportsWithFlag(symbol, ts.SymbolFlags.EnumMember)
    );
}

function convertEnumMember(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const reflection = context.createDeclarationReflection(
        ReflectionKind.EnumMember,
        symbol,
        nameOverride
    );

    reflection.defaultValue = JSON.stringify(
        context.checker.getConstantValue(
            symbol.getDeclarations()![0] as ts.EnumMember
        )
    );
}

function convertNamespace(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const reflection = context.createDeclarationReflection(
        ReflectionKind.Namespace,
        symbol,
        nameOverride
    );

    convertSymbols(
        context.withScope(reflection),
        getSymbolExportsWithFlag(symbol, ts.SymbolFlags.ModuleMember)
    );
}

function convertTypeAlias(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const reflection = context.createDeclarationReflection(
        ReflectionKind.TypeAlias,
        symbol,
        nameOverride
    );

    const declaration = symbol
        ?.getDeclarations()
        ?.find(ts.isTypeAliasDeclaration);
    assert(declaration);
    reflection.type = context.converter.convertType(context, declaration.type);

    reflection.typeParameters = declaration.typeParameters?.map((param) =>
        createTypeParamReflection(param, context.withScope(reflection))
    );
}

function createTypeParamReflection(
    param: ts.TypeParameterDeclaration,
    context: Context
) {
    const constraint = param.constraint
        ? context.converter.convertType(context, param.constraint)
        : void 0;
    const defaultType = param.default
        ? context.converter.convertType(context, param.default)
        : void 0;
    const paramRefl = new TypeParameterReflection(
        param.name.text,
        constraint,
        defaultType,
        context.scope
    );
    context.registerReflection(paramRefl, undefined);
    context.trigger(ConverterEvents.CREATE_TYPE_PARAMETER, paramRefl, param);
    return paramRefl;
}

function convertFunctionOrMethod(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    // Can't just check method flag because this might be called for properties as well
    // This will *NOT* be called for variables that look like functions, they need a special case.
    const isMethod = !!(
        symbol.flags &
        (ts.SymbolFlags.Property | ts.SymbolFlags.Method)
    );

    const declarations =
        symbol.getDeclarations()?.filter(ts.isFunctionLike) ?? [];

    // Don't do anything if we inherited this method and it is private.
    if (
        isMethod &&
        isInherited(context, symbol) &&
        declarations.length > 0 &&
        hasFlag(
            ts.getCombinedModifierFlags(declarations[0]),
            ts.ModifierFlags.Private
        )
    ) {
        return;
    }

    const parentSymbol = context.project.getSymbolFromReflection(context.scope);

    const locationDeclaration =
        parentSymbol
            ?.getDeclarations()
            ?.find(
                (d) => ts.isClassDeclaration(d) || ts.isInterfaceDeclaration(d)
            ) ??
        parentSymbol?.getDeclarations()?.[0]?.getSourceFile() ??
        symbol.getDeclarations()?.[0]?.getSourceFile();
    assert(locationDeclaration, "Missing declaration context");

    const type = context.checker.getTypeOfSymbolAtLocation(
        symbol,
        locationDeclaration
    );
    const signatures = type.getCallSignatures();

    const reflection = context.createDeclarationReflection(
        isMethod ? ReflectionKind.Method : ReflectionKind.Function,
        symbol,
        nameOverride
    );

    if (declarations.length && isMethod) {
        // All method signatures must have the same modifier flags.
        setModifiers(declarations[0], reflection);

        assert(parentSymbol, "Tried to convert a method without a parent.");
        if (
            parentSymbol
                .getDeclarations()
                ?.some((d) => d === declarations[0].parent)
        ) {
            reflection.setOverwrites();
        }
    }

    const scope = context.withScope(reflection);
    reflection.signatures ??= [];
    for (const [signature, declaration] of zip(signatures, declarations)) {
        const converted = createSignature(
            scope,
            ReflectionKind.CallSignature,
            signature,
            declaration
        );
        reflection.signatures.push(converted);
    }
}

// getDeclaredTypeOfSymbol gets the INSTANCE type
// getTypeOfSymbolAtLocation gets the STATIC type
function convertClassOrInterface(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const reflection = context.createDeclarationReflection(
        ts.SymbolFlags.Class & symbol.flags
            ? ReflectionKind.Class
            : ReflectionKind.Interface,
        symbol,
        nameOverride
    );
    const reflectionContext = context.withScope(reflection);

    const instanceType = context.checker.getDeclaredTypeOfSymbol(symbol);
    assert(instanceType.isClassOrInterface());

    const classDeclaration = symbol
        .getDeclarations()
        ?.find(ts.isClassDeclaration);
    if (classDeclaration) {
        setModifiers(classDeclaration, reflection);

        // Classes can have static props
        const staticType = context.checker.getTypeOfSymbolAtLocation(
            symbol,
            classDeclaration
        );

        for (const prop of context.checker.getPropertiesOfType(staticType)) {
            // Don't convert namespace members, or the prototype here.
            if (
                prop.flags &
                (ts.SymbolFlags.ModuleMember | ts.SymbolFlags.Prototype)
            )
                continue;
            convertSymbol(reflectionContext, prop);
        }

        const constructMember = new DeclarationReflection(
            "constructor",
            ReflectionKind.Constructor,
            reflection
        );
        reflectionContext.addChild(constructMember);
        // The symbol is already taken by the class.
        context.registerReflection(constructMember, undefined);

        context.trigger(
            ConverterEvents.CREATE_DECLARATION,
            constructMember,
            classDeclaration.getChildren().find(ts.isConstructorDeclaration)
        );

        const constructContext = reflectionContext.withScope(constructMember);

        constructMember.signatures = staticType
            .getConstructSignatures()
            .map((sig) => {
                const sigRef = createSignature(
                    constructContext,
                    ReflectionKind.ConstructorSignature,
                    sig
                );
                sigRef.name = `new ${reflectionContext.scope.name}`; // eww.. preserving legacy behavior.
                sigRef.originalName = sigRef.name;
                return sigRef;
            });
    }

    // Classes/interfaces usually just have properties...
    convertSymbols(
        reflectionContext,
        context.checker.getPropertiesOfType(instanceType)
    );

    // And type arguments
    if (instanceType.typeParameters) {
        reflection.typeParameters = instanceType.typeParameters.map((param) => {
            const declaration = param.symbol?.declarations?.[0];
            assert(ts.isTypeParameterDeclaration(declaration));
            return createTypeParamReflection(declaration, reflectionContext);
        });
    }

    // We also might do some inheritance
    const declarations =
        symbol
            .getDeclarations()
            ?.filter(
                (d): d is ts.InterfaceDeclaration | ts.ClassDeclaration =>
                    ts.isInterfaceDeclaration(d) || ts.isClassDeclaration(d)
            ) ?? [];

    const extendedTypes = flatMap(declarations, (decl) =>
        flatMap(decl.heritageClauses ?? [], (clause) => {
            if (clause.token !== ts.SyntaxKind.ExtendsKeyword) {
                return [];
            }
            return clause.types.map((type) =>
                context.converter.convertType(reflectionContext, type)
            );
        })
    );
    if (extendedTypes.length) {
        reflection.extendedTypes = uniqueByEquals(extendedTypes);
    }

    const implementedTypes = flatMap(declarations, (decl) =>
        flatMap(decl.heritageClauses ?? [], (clause) => {
            if (clause.token !== ts.SyntaxKind.ImplementsKeyword) {
                return [];
            }
            return clause.types.map((type) =>
                context.converter.convertType(reflectionContext, type)
            );
        })
    );
    if (implementedTypes.length) {
        reflection.implementedTypes = uniqueByEquals(implementedTypes);
    }

    // Interfaces might also have call signatures
    // Classes might too, because of declaration merging
    const callSignatures = context.checker
        .getSignaturesOfType(instanceType, ts.SignatureKind.Call)
        .map((sig) =>
            createSignature(
                reflectionContext,
                ReflectionKind.CallSignature,
                sig
            )
        );
    if (callSignatures.length) {
        reflection.signatures = callSignatures;
    }

    // We also might have constructor signatures
    // This is potentially a problem with classes having
    convertConstructSignatures(reflectionContext, symbol);

    // And finally, index signatures
    convertIndexSignature(reflectionContext, symbol);
}

function convertProperty(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const declarations = symbol.getDeclarations() ?? [];
    const parentSymbol = context.project.getSymbolFromReflection(context.scope);
    assert(parentSymbol);

    // Don't do anything if we inherited this property and it is private.
    if (
        isInherited(context, symbol) &&
        declarations.length > 0 &&
        hasFlag(
            ts.getCombinedModifierFlags(declarations[0]),
            ts.ModifierFlags.Private
        )
    ) {
        return;
    }

    // Special case: We pretend properties are methods if they look like methods.
    // This happens with mixins / weird inheritance.
    if (
        declarations.every(
            (decl) => ts.isMethodSignature(decl) || ts.isMethodDeclaration(decl)
        )
    ) {
        return convertFunctionOrMethod(context, symbol, nameOverride);
    }

    // Special case: "arrow methods" should be treated as methods.
    if (declarations.length === 1) {
        const declaration = declarations[0];
        if (
            ts.isPropertyDeclaration(declaration) &&
            !declaration.type &&
            declaration.initializer &&
            ts.isArrowFunction(declaration.initializer)
        ) {
            return convertArrowAsMethod(
                context,
                symbol,
                declaration.initializer,
                nameOverride
            );
        }
    }

    const reflection = context.createDeclarationReflection(
        ReflectionKind.Property,
        symbol,
        nameOverride
    );

    const declaration = symbol.getDeclarations()?.[0];
    let parameterType: ts.TypeNode | undefined;

    if (
        declaration &&
        (ts.isPropertyDeclaration(declaration) ||
            ts.isPropertySignature(declaration) ||
            ts.isParameter(declaration))
    ) {
        parameterType = declaration.type;
        setModifiers(declaration, reflection);
        const parentSymbol = context.project.getSymbolFromReflection(
            context.scope
        );
        assert(parentSymbol, "Tried to convert a property without a parent.");
        if (
            parentSymbol
                .getDeclarations()
                ?.some((d) => d === declaration.parent)
        ) {
            reflection.setOverwrites();
        }
        if (ts.isPrivateIdentifier(declaration.name)) {
            reflection.setFlag(ReflectionFlag.Private);
        }
    }
    reflection.defaultValue = declaration && convertDefaultValue(declaration);

    // FIXME: This is a horrible hack because getTypeOfSymbol is not exposed.
    // The right solution here is probably to keep track of parent nodes...
    // but that's tricky because not every reflection is guaranteed to have a
    // parent node. This will probably break in a future TS version.
    reflection.type = context.converter.convertType(
        context,
        parameterType ??
            context.checker.getTypeOfSymbolAtLocation(symbol, {} as any)
    );
}

function convertArrowAsMethod(
    context: Context,
    symbol: ts.Symbol,
    arrow: ts.ArrowFunction,
    nameOverride?: string
) {
    const reflection = context.createDeclarationReflection(
        ReflectionKind.Method,
        symbol,
        nameOverride
    );
    const rc = context.withScope(reflection);

    const signature = context.checker.getSignatureFromDeclaration(arrow);
    assert(signature);

    const parentSymbol = context.project.getSymbolFromReflection(context.scope);
    assert(parentSymbol, "Tried to convert an arrow method without a parent.");
    if (parentSymbol.getDeclarations()?.some((d) => d === arrow.parent)) {
        reflection.setOverwrites();
    }

    reflection.signatures = [
        createSignature(rc, ReflectionKind.CallSignature, signature, arrow),
    ];
}

function convertConstructor(context: Context, symbol: ts.Symbol) {
    const reflection = context.createDeclarationReflection(
        ReflectionKind.Constructor,
        symbol,
        "constructor"
    );
    const reflectionContext = context.withScope(reflection);

    const declarations =
        symbol.getDeclarations()?.filter(ts.isConstructorDeclaration) ?? [];
    const signatures = declarations.map((decl) => {
        const sig = context.checker.getSignatureFromDeclaration(decl);
        assert(sig);
        return sig;
    });

    reflection.signatures = signatures.map((sig) => {
        const sigRef = createSignature(
            reflectionContext,
            ReflectionKind.ConstructorSignature,
            sig
        );
        sigRef.name = `new ${context.scope.name}`; // eww.. preserving legacy behavior.
        sigRef.originalName = sigRef.name;
        return sigRef;
    });
}

function convertConstructSignatures(context: Context, symbol: ts.Symbol) {
    const type = context.checker.getDeclaredTypeOfSymbol(symbol);

    // These get added as a "constructor" member of this interface. This is a problem... but nobody
    // has complained yet. We really ought to have a constructSignatures property on the reflection instead.
    const constructSignatures = context.checker.getSignaturesOfType(
        type,
        ts.SignatureKind.Construct
    );
    if (constructSignatures.length) {
        const constructMember = new DeclarationReflection(
            "constructor",
            ReflectionKind.Constructor,
            context.scope
        );
        context.addChild(constructMember);
        context.registerReflection(constructMember, undefined);

        context.trigger(
            ConverterEvents.CREATE_DECLARATION,
            constructMember,
            // FIXME this isn't good enough.
            context.converter.getNodesForSymbol(
                symbol,
                ReflectionKind.Constructor
            )[0]
        );

        const constructContext = context.withScope(constructMember);

        constructMember.signatures = constructSignatures.map((sig) => {
            const sigRef = createSignature(
                constructContext,
                ReflectionKind.ConstructorSignature,
                sig
            );
            sigRef.name = `new ${context.scope.name}`; // eww.. preserving legacy behavior.
            sigRef.originalName = sigRef.name;
            return sigRef;
        });
    }
}

function convertAlias(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const reflection = context.project.getReflectionFromSymbol(
        context.resolveAliasedSymbol(symbol)
    );
    if (!reflection) {
        // We don't have this, convert it.
        convertSymbol(
            context,
            context.resolveAliasedSymbol(symbol),
            nameOverride ?? symbol.name
        );
    } else {
        // We already have this. Create a reference.
        const ref = new ReferenceReflection(
            nameOverride ?? symbol.name,
            reflection,
            context.scope
        );
        context.addChild(ref);
        context.registerReflection(ref, symbol);

        context.trigger(
            ConverterEvents.CREATE_DECLARATION,
            reflection,
            // FIXME this isn't good enough.
            context.converter.getNodesForSymbol(
                symbol,
                ReflectionKind.Reference
            )[0]
        );
    }
}

function convertVariable(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const declaration = symbol.getDeclarations()?.[0];
    assert(declaration);

    const type = context.checker.getTypeOfSymbolAtLocation(symbol, declaration);

    if (type.getCallSignatures().length && !type.getProperties().length) {
        return convertVariableAsFunction(context, symbol, nameOverride);
    }

    const reflection = context.createDeclarationReflection(
        ReflectionKind.Variable,
        symbol,
        nameOverride
    );

    let typeNode: ts.TypeNode | undefined;
    if (ts.isVariableDeclaration(declaration)) {
        // Otherwise we might have destructuring
        typeNode = declaration.type;
    }

    reflection.type = context.converter.convertType(
        context.withScope(reflection),
        typeNode ??
            context.checker.getTypeOfSymbolAtLocation(symbol, declaration)
    );

    setModifiers(declaration, reflection);

    reflection.defaultValue = convertDefaultValue(declaration);
}

function convertVariableAsFunction(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const declaration = symbol
        .getDeclarations()
        ?.find(ts.isVariableDeclaration);
    assert(declaration);

    const type = context.checker.getTypeOfSymbolAtLocation(symbol, declaration);

    const reflection = context.createDeclarationReflection(
        ReflectionKind.Function,
        symbol,
        nameOverride
    );
    setModifiers(declaration, reflection);

    const reflectionContext = context.withScope(reflection);

    reflection.signatures ??= [];
    for (const signature of type.getCallSignatures()) {
        reflection.signatures.push(
            createSignature(
                reflectionContext,
                ReflectionKind.CallSignature,
                signature,
                void 0,
                declaration
            )
        );
    }
}

function convertAccessor(
    context: Context,
    symbol: ts.Symbol,
    nameOverride?: string
) {
    const reflection = context.createDeclarationReflection(
        ReflectionKind.Accessor,
        symbol,
        nameOverride
    );
    const rc = context.withScope(reflection);

    const getDeclaration = symbol.getDeclarations()?.find(ts.isGetAccessor);
    if (getDeclaration) {
        const signature = context.checker.getSignatureFromDeclaration(
            getDeclaration
        );
        if (signature) {
            reflection.getSignature = createSignature(
                rc,
                ReflectionKind.GetSignature,
                signature,
                getDeclaration
            );
        }
    }

    const setDeclaration = symbol.getDeclarations()?.find(ts.isSetAccessor);
    if (setDeclaration) {
        const signature = context.checker.getSignatureFromDeclaration(
            setDeclaration
        );
        if (signature) {
            reflection.setSignature = createSignature(
                rc,
                ReflectionKind.SetSignature,
                signature,
                setDeclaration
            );
        }
    }
}

function isInherited(context: Context, symbol: ts.Symbol) {
    const parentSymbol = context.project.getSymbolFromReflection(context.scope);
    assert(parentSymbol);
    return (
        parentSymbol
            .getDeclarations()
            ?.some((d) =>
                symbol.getDeclarations()?.some((d2) => d2.parent === d)
            ) === false
    );
}

function setModifiers(declaration: ts.Declaration, reflection: Reflection) {
    const modifiers = ts.getCombinedModifierFlags(declaration);
    // Note: We only set this flag if the modifier is present because we allow
    // fake "private" or "protected" members via @private and @protected
    if (hasFlag(modifiers, ts.ModifierFlags.Private)) {
        reflection.setFlag(ReflectionFlag.Private);
    }
    if (hasFlag(modifiers, ts.ModifierFlags.Protected)) {
        reflection.setFlag(ReflectionFlag.Protected);
    }
    if (hasFlag(modifiers, ts.ModifierFlags.Public)) {
        reflection.setFlag(ReflectionFlag.Public);
    }
    reflection.setFlag(
        ReflectionFlag.Optional,
        !!(declaration as any).questionToken
    );
    reflection.setFlag(
        ReflectionFlag.Readonly,
        hasFlag(modifiers, ts.ModifierFlags.Readonly)
    );
    reflection.setFlag(
        ReflectionFlag.Abstract,
        hasFlag(modifiers, ts.ModifierFlags.Abstract)
    );
    reflection.setFlag(
        ReflectionFlag.Static,
        hasFlag(modifiers, ts.ModifierFlags.Static)
    );
}
