import * as assert from 'assert';
import * as ts from 'typescript';
import { posix } from 'path';

import { Application } from '../application';
import { ModuleReflection, ProjectReflection, SomeContainerReflection, SomeReflection, SomeType, UnknownType, IntrinsicType } from '../models/index';
import { ObjectReflection } from '../models/reflections/object';
import { insertOrderSorted } from '../utils';
import { EventEmitter } from '../utils/event';
import { Context } from './context';
import { addConverters, ReflectionConverter } from './nodes';
import { addTypeNodeConverters, TypeNodeConverter } from './type-nodes';
import { addTypeConverters, TypeConverter } from './types';
import { getCommonDirectory } from '../utils/fs'
import { getCommentForNodes } from './comments'
import { discoverProjectInfo } from './utils'

interface ConverterEventMap {
    begin: [ProjectReflection, ts.Program];
    reflectionCreated: [SomeReflection, ts.Symbol, ts.Node[]];
    moduleCreated: [ModuleReflection, ts.SourceFile];
    end: [ProjectReflection];
}

export class Converter extends EventEmitter<ConverterEventMap> {
    /** @event */
    static readonly EVENT_BEGIN = 'begin';
    /** @event */
    static readonly EVENT_END = 'end';

    /**
     * Fired for all reflection creation events except the creation of the main
     * project reflection and the module reflections contained within it.
     *
     * This cannot be fired for module reflections since, if a file is global,
     * there will not be a TypeScript symbol associated with it. Similarly, the
     * project reflection also has no single symbol associated with it. To listen
     * to the creation of a project reflection and module reflection, listen to
     * the {@link BEGIN} and {@link MODULE_CREATED} events, respectively.
     *
     * @event
     */
    static readonly EVENT_REFLECTION_CREATED = 'reflectionCreated';

    /** @event */
    static readonly EVENT_MODULE_CREATED = 'moduleCreated';

    get options() {
        return this.application.options;
    }

    get logger() {
        return this.application.logger;
    }

    get checker() {
        assert(this._checker, 'type checker may only be accessed while conversion is in progress.');
        return this._checker;
    }

    get project() {
        assert(this._project, 'project may only be accessed while conversion is in progress.');
        return this._project;
    }

    private _checker?: ts.TypeChecker;
    private _project?: ProjectReflection;
    private _reflectionConverters = new Map<ts.SyntaxKind, ReflectionConverter>();
    private _typeNodeConverters = new Map<ts.SyntaxKind, TypeNodeConverter>();
    private _typeConverters: TypeConverter[] = [];

    constructor(
        readonly application: Application
    ) {
        super();
        addConverters(this);
        addTypeNodeConverters(this);
        addTypeConverters(this);
    }

    addReflectionConverter(converter: ReflectionConverter) {
        for (const kind of converter.kind) {
            assert(!this._reflectionConverters.has(kind), `Duplicate converter for ${ts.SyntaxKind[kind]}`);
            this._reflectionConverters.set(kind, converter);
        }
    }

    addTypeNodeConverter(converter: TypeNodeConverter) {
        for (const kind of converter.kind) {
            assert(!this._reflectionConverters.has(kind), `Duplicate type node converter for ${ts.SyntaxKind[kind]}`);
            this._typeNodeConverters.set(kind, converter);
        }
    }

    addTypeConverter(converter: TypeConverter) {
        insertOrderSorted(this._typeConverters, converter);
    }

    async convert(program: ts.Program, inputFiles: string[]) {
        const start = Date.now();
        const compilerOptions = program.getCompilerOptions();
        const rootDir = compilerOptions.rootDir ?? getCommonDirectory(program.getRootFileNames());
        this._checker = program.getTypeChecker();

        const { name, readme } = await discoverProjectInfo(rootDir,
            this.options.getValue('name'),
            this.options.getValue('readme'),
            this.options.getValue('includeVersion'));
        const project = this._project = new ProjectReflection(name, readme);
        await this.emit(Converter.EVENT_BEGIN, project, program);

        const context = new Context(program, this, project, project);

        // Due to the order juggling necessary to only document each item once, the module
        // converter is not a standard converter.
        for (const entry of inputFiles) {
            const entryStart = Date.now();
            this.logger.verbose(`First pass: ${entry}`);

            const file = program.getSourceFile(entry);
            if (!file) {
                this.logger.error(`Failed to find source file for entry point ${entry}`);
                continue;
            }

            const name = posix.relative(rootDir, file.fileName).replace(/(\.d)?\.[tj]sx?$/, '');

            const moduleReflection = new ModuleReflection(name);
            moduleReflection.comment = getCommentForNodes([file]);
            project.addChild(moduleReflection);
            await this.emit(Converter.EVENT_MODULE_CREATED, moduleReflection, file);
            for (const exportSymbol of this.getExportsOfModule(file, program.getTypeChecker())) {
                await this.convertSymbol(exportSymbol, context.withContainer(moduleReflection));
            }

            this.logger.verbose(`[Perf] Converting ${name} took ${Date.now() - entryStart}ms`);
        }

        await this.emit(Converter.EVENT_END, project);

        this._checker = undefined;
        this._project = undefined;
        this.logger.verbose(`[Perf] Conversion took ${Date.now() - start}ms`);
        return project;
    }

    async convertSymbol<U extends SomeContainerReflection>(symbol: ts.Symbol, context: Context<U>) {
        this.logger.verbose(`Converting symbol: ${symbol.name}`);
        const kinds = new Set(symbol.getDeclarations()?.map(d => d.kind));
        if (kinds.has(ts.SyntaxKind.ClassDeclaration)) {
            // This is the one form of declaration merging we do, merging classes and interfaces.
            kinds.delete(ts.SyntaxKind.InterfaceDeclaration);
        }
        if (kinds.has(ts.SyntaxKind.GetAccessor)) {
            // Not exactly declaration merging... we treat accessors as one API item.
            kinds.delete(ts.SyntaxKind.SetAccessor);
        }

        await Promise.all([...kinds].map(async kind => {
            const converter = this._reflectionConverters.get(kind);
            if (!converter) {
                this.logger.verbose(`Missing converter for symbol ${symbol.name} with kind ${kind} (${ts.SyntaxKind[kind]})`);
                return;
            }
            const nodes = symbol.getDeclarations()?.filter(d => d.kind === kind) ?? [];
            if (kind === ts.SyntaxKind.ClassDeclaration) {
                nodes.push(...symbol.getDeclarations()?.filter(d => d.kind === ts.SyntaxKind.InterfaceDeclaration) ?? []);
            }
            const child = await converter.convert(context, symbol, nodes);
            child.comment = getCommentForNodes(nodes);
            // TS isn't smart enough to know this is safe. The converters are carefully structured so that it is.
            context.container.addChild(child as any);
            await this.emit(Converter.EVENT_REFLECTION_CREATED, child, symbol, nodes);
        }));
    }

    async convertTypeOrObject(typeNode: ts.TypeNode, type?: ts.Type): Promise<SomeType | ObjectReflection>;
    async convertTypeOrObject(typeNode: ts.TypeNode | undefined, type: ts.Type): Promise<SomeType | ObjectReflection>;
    async convertTypeOrObject(typeNode?: ts.TypeNode, type?: ts.Type): Promise<SomeType | ObjectReflection> {
        // TODO: Fix this
        if (typeNode && ts.isTypeLiteralNode(typeNode)) {
            this.logger.verbose('TODO Fix convertTypeOrObject');
            return new ObjectReflection('TODO', [], [], []);
        }
        return this.convertType(typeNode, type!);
    }

    // Unlike convertSymbol, types aren't immediately interesting without being tied to something.
    // They don't emit events and thus can be converted synchronously.
    convertType(typeNode: ts.TypeNode | undefined, type?: ts.Type): SomeType {
        assert(this._checker, 'convertType may only be called when a call to convert is in progress.');

        if (!typeNode && !type) {
            return new IntrinsicType('any');
        }

        if (typeNode) {
            type = type ?? this._checker.getTypeAtLocation(typeNode);
            const converter = this._typeNodeConverters.get(typeNode.kind);
            if (converter) {
                return converter.convert(this, typeNode, type);
            }
            this.logger.verbose(`Missing type node converter for kind ${typeNode.kind} (${ts.SyntaxKind[typeNode.kind]})`);
        }

        assert(type); // Shouldn't be possible for this to fail.
        for (const converter of this._typeConverters) {
            if (converter.supports(type, this._checker)) {
                return converter.convert(this, type, this._checker);
            }
        }

        this.logger.verbose(`Missing type converter for type: ${this._checker.typeToString(type)}`);
        return new UnknownType(this._checker.typeToString(type));
    }

    private getExportsOfModule(file: ts.SourceFile, checker: ts.TypeChecker) {
        const symbol = checker.getSymbolAtLocation(file);
        // TODO: Need to support global symbols, iterate over children, get symbols for each child, dedupe.
        if (!symbol) { return []; }
        return checker.getExportsOfModule(symbol);
    }
}
