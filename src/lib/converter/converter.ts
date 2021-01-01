import * as ts from "typescript";
import * as _ from "lodash";
import * as assert from "assert";
import { resolve } from "path";

import { Application } from "../application";
import { Type, ProjectReflection, ReflectionKind } from "../models/index";
import { Context } from "./context";
import { ConverterComponent } from "./components";
import { Component, ChildableComponent } from "../utils/component";
import { BindOption, normalizePath } from "../utils";
import { convertType } from "./types";
import { ConverterEvents } from "./converter-events";
import { convertSymbol } from "./symbols";
import { relative } from "path";
import { getCommonDirectory } from "../utils/fs";
import { createMinimatch } from "../utils/paths";
import { IMinimatch } from "minimatch";
import { hasFlag } from "../utils/enum";

/**
 * Compiles source files using TypeScript and converts compiler symbols to reflections.
 */
@Component({
    name: "converter",
    internal: true,
    childClass: ConverterComponent,
})
export class Converter extends ChildableComponent<
    Application,
    ConverterComponent
> {
    /**
     * The human readable name of the project. Used within the templates to set the title of the document.
     */
    @BindOption("name")
    name!: string;

    @BindOption("externalPattern")
    externalPattern!: string[];
    private externalPatternCache?: IMinimatch[];

    @BindOption("excludeExternals")
    excludeExternals!: boolean;

    @BindOption("excludeNotDocumented")
    excludeNotDocumented!: boolean;

    @BindOption("excludePrivate")
    excludePrivate!: boolean;

    @BindOption("excludeProtected")
    excludeProtected!: boolean;

    /**
     * General events
     */

    /**
     * Triggered when the converter begins converting a project.
     * The listener should implement [[IConverterCallback]].
     * @event
     */
    static readonly EVENT_BEGIN = ConverterEvents.BEGIN;

    /**
     * Triggered when the converter has finished converting a project.
     * The listener should implement [[IConverterCallback]].
     * @event
     */
    static readonly EVENT_END = ConverterEvents.END;

    /**
     * Factory events
     */

    /**
     * Triggered when the converter has created a declaration reflection.
     * The listener should implement [[IConverterNodeCallback]].
     * @event
     */
    static readonly EVENT_CREATE_DECLARATION =
        ConverterEvents.CREATE_DECLARATION;

    /**
     * Triggered when the converter has created a signature reflection.
     * The listener should implement [[IConverterNodeCallback]].
     * @event
     */
    static readonly EVENT_CREATE_SIGNATURE = ConverterEvents.CREATE_SIGNATURE;

    /**
     * Triggered when the converter has created a parameter reflection.
     * The listener should implement [[IConverterNodeCallback]].
     * @event
     */
    static readonly EVENT_CREATE_PARAMETER = ConverterEvents.CREATE_PARAMETER;

    /**
     * Triggered when the converter has created a type parameter reflection.
     * The listener should implement [[IConverterNodeCallback]].
     * @event
     */
    static readonly EVENT_CREATE_TYPE_PARAMETER =
        ConverterEvents.CREATE_TYPE_PARAMETER;

    /**
     * Resolve events
     */

    /**
     * Triggered when the converter begins resolving a project.
     * The listener should implement [[IConverterCallback]].
     * @event
     */
    static readonly EVENT_RESOLVE_BEGIN = ConverterEvents.RESOLVE_BEGIN;

    /**
     * Triggered when the converter resolves a reflection.
     * The listener should implement [[IConverterResolveCallback]].
     * @event
     */
    static readonly EVENT_RESOLVE = ConverterEvents.RESOLVE;

    /**
     * Triggered when the converter has finished resolving a project.
     * The listener should implement [[IConverterCallback]].
     * @event
     */
    static readonly EVENT_RESOLVE_END = ConverterEvents.RESOLVE_END;

    /**
     * Compile the given source files and create a project reflection for them.
     *
     * @param entryPoints the entry points of this program.
     * @param program the program to document that has already been type checked.
     */
    convert(
        entryPoints: readonly string[],
        programs: ts.Program | readonly ts.Program[]
    ): ProjectReflection | undefined {
        programs = programs instanceof Array ? programs : [programs];
        this.externalPatternCache = void 0;

        const project = new ProjectReflection(this.name);
        const context = new Context(this, programs, project);

        this.trigger(Converter.EVENT_BEGIN, context);

        this.compile(entryPoints, context);
        this.resolve(context);
        // This should only do anything if a plugin does something bad.
        project.removeDanglingReferences();

        this.trigger(Converter.EVENT_END, context);

        return project;
    }

    /** @internal */
    convertSymbol(context: Context, symbol: ts.Symbol) {
        convertSymbol(context, symbol);
    }

    /**
     * Convert the given TypeScript type into its TypeDoc type reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param referenceTarget The target to be used to attempt to resolve reference types
     * @returns The TypeDoc type reflection representing the given node and type.
     * @internal
     */
    convertType(
        context: Context,
        node: ts.TypeNode | ts.Type | undefined
    ): Type {
        return convertType(context, node);
    }

    /** @internal */
    getNodesForSymbol(symbol: ts.Symbol, kind: ReflectionKind) {
        const wantedKinds: ts.SyntaxKind[] = {
            [ReflectionKind.Project]: [ts.SyntaxKind.SourceFile],
            [ReflectionKind.Module]: [ts.SyntaxKind.SourceFile],
            [ReflectionKind.Namespace]: [
                ts.SyntaxKind.ModuleDeclaration,
                ts.SyntaxKind.SourceFile,
            ],
            [ReflectionKind.Enum]: [ts.SyntaxKind.EnumDeclaration],
            [ReflectionKind.EnumMember]: [ts.SyntaxKind.EnumMember],
            [ReflectionKind.Variable]: [ts.SyntaxKind.VariableDeclaration],
            [ReflectionKind.Function]: [
                ts.SyntaxKind.FunctionDeclaration,
                ts.SyntaxKind.VariableDeclaration,
            ],
            [ReflectionKind.Class]: [ts.SyntaxKind.ClassDeclaration],
            [ReflectionKind.Interface]: [
                ts.SyntaxKind.InterfaceDeclaration,
                ts.SyntaxKind.JSDocTypedefTag,
            ],
            [ReflectionKind.Constructor]: [ts.SyntaxKind.Constructor],
            [ReflectionKind.Property]: [
                ts.SyntaxKind.PropertyDeclaration,
                ts.SyntaxKind.PropertySignature,
                ts.SyntaxKind.JSDocPropertyTag,
            ],
            [ReflectionKind.Method]: [
                ts.SyntaxKind.MethodDeclaration,
                ts.SyntaxKind.PropertyDeclaration,
                ts.SyntaxKind.PropertySignature,
            ],
            [ReflectionKind.CallSignature]: [
                ts.SyntaxKind.FunctionDeclaration,
                ts.SyntaxKind.VariableDeclaration,
                ts.SyntaxKind.MethodDeclaration,
                ts.SyntaxKind.MethodDeclaration,
                ts.SyntaxKind.PropertyDeclaration,
                ts.SyntaxKind.PropertySignature,
                ts.SyntaxKind.CallSignature,
            ],
            [ReflectionKind.IndexSignature]: [ts.SyntaxKind.IndexSignature],
            [ReflectionKind.ConstructorSignature]: [
                ts.SyntaxKind.ConstructSignature,
            ],
            [ReflectionKind.Parameter]: [ts.SyntaxKind.Parameter],
            [ReflectionKind.TypeLiteral]: [ts.SyntaxKind.TypeLiteral],
            [ReflectionKind.TypeParameter]: [ts.SyntaxKind.TypeParameter],
            [ReflectionKind.Accessor]: [
                ts.SyntaxKind.GetAccessor,
                ts.SyntaxKind.SetAccessor,
            ],
            [ReflectionKind.GetSignature]: [ts.SyntaxKind.GetAccessor],
            [ReflectionKind.SetSignature]: [ts.SyntaxKind.SetAccessor],
            [ReflectionKind.TypeAlias]: [
                ts.SyntaxKind.TypeAliasDeclaration,
                ts.SyntaxKind.JSDocTypedefTag,
            ],
            [ReflectionKind.Event]: [], /// this needs to go away
            [ReflectionKind.Reference]: [
                ts.SyntaxKind.NamespaceExport,
                ts.SyntaxKind.ExportSpecifier,
            ],
        }[kind];

        const declarations = symbol.getDeclarations() ?? [];
        return declarations.filter((d) => wantedKinds.includes(d.kind));
    }

    /**
     * Compile the files within the given context and convert the compiler symbols to reflections.
     *
     * @param context  The context object describing the current state the converter is in.
     * @returns An array containing all errors generated by the TypeScript compiler.
     */
    private compile(entryPoints: readonly string[], context: Context) {
        const baseDir = getCommonDirectory(entryPoints);
        const entries: {
            file: string;
            sourceFile: ts.SourceFile;
            program: ts.Program;
            context?: Context;
        }[] = [];

        entryLoop: for (const file of entryPoints.map(normalizePath)) {
            for (const program of context.programs) {
                const sourceFile = program.getSourceFile(file);
                if (sourceFile) {
                    entries.push({ file, sourceFile, program });
                    continue entryLoop;
                }
            }
            this.application.logger.warn(
                `Unable to locate entry point: ${file}`
            );
        }

        for (const entry of entries) {
            context.setActiveProgram(entry.program);
            entry.context = this.convertExports(
                context,
                entry.sourceFile,
                entryPoints,
                getModuleName(resolve(entry.file), baseDir)
            );
        }

        for (const { sourceFile, context } of entries) {
            // active program is already set on context
            assert(context);
            this.convertReExports(context, sourceFile);
        }

        context.setActiveProgram(undefined);
    }

    private convertExports(
        context: Context,
        node: ts.SourceFile,
        entryPoints: readonly string[],
        entryName: string
    ) {
        const symbol = context.checker.getSymbolAtLocation(node) ?? node.symbol;
        let moduleContext: Context;

        if (entryPoints.length === 1) {
            // Special case for when we're giving a single entry point, we don't need to
            // create modules for each entry. Register the project as this module.
            context.project.registerReflection(context.project, symbol);
            moduleContext = context;
        } else {
            const reflection = context.createDeclarationReflection(
                ReflectionKind.Module,
                symbol,
                entryName
            );
            moduleContext = context.withScope(reflection);
        }

        for (const exp of getExports(context, node).filter((exp) =>
            isDirectExport(context.resolveAliasedSymbol(exp), node)
        )) {
            convertSymbol(moduleContext, exp);
        }

        return moduleContext;
    }

    private convertReExports(moduleContext: Context, node: ts.SourceFile) {
        for (const exp of getExports(moduleContext, node).filter(
            (exp) =>
                !isDirectExport(moduleContext.resolveAliasedSymbol(exp), node)
        )) {
            convertSymbol(moduleContext, exp);
        }
    }

    /**
     * Resolve the project within the given context.
     *
     * @param context  The context object describing the current state the converter is in.
     * @returns The final project reflection.
     */
    private resolve(context: Context): void {
        this.trigger(Converter.EVENT_RESOLVE_BEGIN, context);
        const project = context.project;

        for (const reflection of Object.values(project.reflections)) {
            this.trigger(Converter.EVENT_RESOLVE, context, reflection);
        }

        this.trigger(Converter.EVENT_RESOLVE_END, context);
    }

    /** @internal */
    shouldIgnore(symbol: ts.Symbol, checker: ts.TypeChecker) {
        if (
            this.excludeNotDocumented &&
            // If the enum is included, we should include members even if not documented.
            !hasFlag(symbol.flags, ts.SymbolFlags.EnumMember) &&
            symbol.getDocumentationComment(checker).length === 0
        ) {
            return true;
        }

        if (!this.excludeExternals) {
            return false;
        }

        return this.isExternal(symbol);
    }

    /** @internal */
    isExternal(symbol: ts.Symbol) {
        this.externalPatternCache ??= createMinimatch(this.externalPattern);
        for (const node of symbol.getDeclarations() ?? []) {
            if (
                this.externalPatternCache.some((p) =>
                    p.match(node.getSourceFile().fileName)
                )
            ) {
                return true;
            }
        }

        return false;
    }
}

function getModuleName(fileName: string, baseDir: string) {
    return normalizePath(relative(baseDir, fileName)).replace(
        /(\/index)?(\.d)?\.[tj]sx?$/,
        ""
    );
}

function getExports(
    context: Context,
    node: ts.SourceFile | ts.ModuleBlock
): ts.Symbol[] {
    let symbol = context.checker.getSymbolAtLocation(node) ?? node.symbol;
    if (!symbol && ts.isModuleBlock(node)) {
        symbol = context.checker.getSymbolAtLocation(node.parent.name);
    }

    // The generated docs aren't great, but you really ought not be using
    // this in the first place... so it's better than nothing.
    const exportEq = symbol?.exports?.get("export=" as ts.__String);
    if (exportEq) {
        return [exportEq];
    }

    if (symbol) {
        return context.checker.getExportsOfModule(symbol);
    }

    // This is a global file, get all symbols declared in this file...
    // this isn't the best solution, it would be nice to have all globals given to a special
    // "globals" file, but this is uncommon enough that I'm skipping it for now.
    const sourceFile = node.getSourceFile();
    const globalSymbols = context.checker
        .getSymbolsInScope(node, ts.SymbolFlags.ModuleMember)
        .filter((s) =>
            s.getDeclarations()?.some((d) => d.getSourceFile() === sourceFile)
        );

    // Detect declaration files with declare module "foo" as their only export
    // and lift that up one level
    if (
        globalSymbols.length === 1 &&
        globalSymbols[0]
            .getDeclarations()
            ?.every(
                (declaration) =>
                    ts.isModuleDeclaration(declaration) &&
                    ts.isStringLiteral(declaration.name)
            )
    ) {
        return context.checker.getExportsOfModule(globalSymbols[0]);
    }

    return globalSymbols;
}

function isDirectExport(symbol: ts.Symbol, file: ts.SourceFile): boolean {
    return (
        symbol
            .getDeclarations()
            ?.every((decl) => decl.getSourceFile() === file) ?? false
    );
}
