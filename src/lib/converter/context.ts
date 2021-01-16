import { ok as assert } from "assert";
import * as ts from "typescript";

import {
    Reflection,
    ProjectReflection,
    ContainerReflection,
    DeclarationReflection,
    ReflectionKind,
    ReflectionFlag,
} from "../models/index";

import type { Converter } from "./converter";
import { isNamedNode } from "./utils/nodes";
import { ConverterEvents } from "./converter-events";
import { resolveAliasedSymbol } from "./utils/symbols";

/**
 * The context describes the current state the converter is in.
 * @internal
 */
export class Context {
    /**
     * The converter instance that has created the context.
     */
    readonly converter: Converter;

    /**
     * The TypeChecker instance returned by the TypeScript compiler.
     */
    get checker(): ts.TypeChecker {
        return this.program.getTypeChecker();
    }

    /**
     * The program currently being converted.
     * Accessing this property will throw if a source file is not currently being converted.
     */
    get program(): ts.Program {
        assert(
            this._program,
            "Tried to access Context.program when not converting a source file"
        );
        return this._program;
    }
    private _program?: ts.Program;

    /**
     * All programs being converted.
     */
    readonly programs: readonly ts.Program[];

    /**
     * The project that is currently processed.
     */
    readonly project: ProjectReflection;

    /**
     * The scope or parent reflection that is currently processed.
     */
    readonly scope: Reflection;

    /** @internal */
    isConvertingTypeNode(): boolean {
        return this.convertingTypeNode;
    }

    /** @internal */
    setConvertingTypeNode() {
        this.convertingTypeNode = true;
    }

    private convertingTypeNode = false;

    /**
     * Create a new Context instance.
     *
     * @param converter  The converter instance that has created the context.
     * @param entryPoints  A list of all entry points for this project.
     * @param checker  The TypeChecker instance returned by the TypeScript compiler.
     * @internal
     */
    constructor(
        converter: Converter,
        programs: readonly ts.Program[],
        project: ProjectReflection,
        scope: Context["scope"] = project
    ) {
        this.converter = converter;
        this.programs = programs;

        this.project = project;
        this.scope = scope;
    }

    /** @internal */
    get logger() {
        return this.converter.application.logger;
    }

    /**
     * Return the compiler options.
     */
    getCompilerOptions(): ts.CompilerOptions {
        return this.converter.application.options.getCompilerOptions();
    }

    /**
     * Return the type declaration of the given node.
     *
     * @param node  The TypeScript node whose type should be resolved.
     * @returns The type declaration of the given node.
     */
    getTypeAtLocation(node: ts.Node): ts.Type | undefined {
        let nodeType: ts.Type | undefined;
        try {
            nodeType = this.checker.getTypeAtLocation(node);
        } catch {
            // ignore
        }
        if (!nodeType) {
            if (node.symbol) {
                nodeType = this.checker.getDeclaredTypeOfSymbol(node.symbol);
            } else if (node.parent && node.parent.symbol) {
                nodeType = this.checker.getDeclaredTypeOfSymbol(
                    node.parent.symbol
                );
            } else if (
                node.parent &&
                node.parent.parent &&
                node.parent.parent.symbol
            ) {
                nodeType = this.checker.getDeclaredTypeOfSymbol(
                    node.parent.parent.symbol
                );
            }
        }
        return nodeType;
    }

    getSymbolAtLocation(node: ts.Node): ts.Symbol | undefined {
        let symbol = this.checker.getSymbolAtLocation(node);
        if (!symbol && isNamedNode(node)) {
            symbol = this.checker.getSymbolAtLocation(node.name);
        }
        return symbol;
    }

    expectSymbolAtLocation(node: ts.Node): ts.Symbol {
        const symbol = this.getSymbolAtLocation(node);
        if (!symbol) {
            const { line } = ts.getLineAndCharacterOfPosition(
                node.getSourceFile(),
                node.pos
            );
            throw new Error(
                `Expected a symbol for node with kind ${
                    ts.SyntaxKind[node.kind]
                } at ${node.getSourceFile().fileName}:${line + 1}`
            );
        }
        return symbol;
    }

    resolveAliasedSymbol(symbol: ts.Symbol): ts.Symbol {
        return resolveAliasedSymbol(symbol, this.checker);
    }

    createDeclarationReflection(
        kind: ReflectionKind,
        symbol: ts.Symbol | undefined,
        name = getHumanName(symbol?.name ?? "unknown")
    ) {
        const reflection = new DeclarationReflection(name, kind, this.scope);
        this.addChild(reflection);
        if (symbol && this.converter.isExternal(symbol)) {
            reflection.setFlag(ReflectionFlag.External);
        }
        this.registerReflection(reflection, symbol);

        this.converter.trigger(
            ConverterEvents.CREATE_DECLARATION,
            this,
            reflection,
            // FIXME this isn't good enough.
            symbol && this.converter.getNodesForSymbol(symbol, kind)[0]
        );

        return reflection;
    }

    addChild(reflection: DeclarationReflection) {
        if (this.scope instanceof ContainerReflection) {
            this.scope.children ??= [];
            this.scope.children.push(reflection);
        }
    }

    shouldIgnore(symbol: ts.Symbol) {
        return this.converter.shouldIgnore(symbol, this.checker);
    }

    /**
     * Register a newly generated reflection. All created reflections should be
     * passed to this method to ensure that the project helper functions work correctly.
     *
     * @param reflection  The reflection that should be registered.
     * @param symbol  The symbol the given reflection was resolved from.
     */
    registerReflection(reflection: Reflection, symbol: ts.Symbol | undefined) {
        this.project.registerReflection(reflection, symbol);
    }

    /**
     * Trigger a node reflection event.
     *
     * All events are dispatched on the current converter instance.
     *
     * @param name  The name of the event that should be triggered.
     * @param reflection  The triggering reflection.
     * @param node  The triggering TypeScript node if available.
     */
    trigger(name: string, reflection: Reflection, node?: ts.Node) {
        this.converter.trigger(name, this, reflection, node);
    }

    /** @internal */
    setActiveProgram(program: ts.Program | undefined) {
        this._program = program;
    }

    /**
     * @param callback  The callback function that should be executed with the changed context.
     */
    public withScope(scope: Reflection): Context {
        const context = new Context(
            this.converter,
            this.programs,
            this.project,
            scope
        );
        context.convertingTypeNode = this.convertingTypeNode;
        context.setActiveProgram(this._program);
        return context;
    }
}

const builtInSymbolRegExp = /^__@(\w+)$/;

function getHumanName(name: string) {
    const match = builtInSymbolRegExp.exec(name);
    if (match) {
        return `[Symbol.${match[1]}]`;
    }
    return name;
}
