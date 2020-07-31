import * as assert from "assert";
import * as ts from "typescript";
import { relative, resolve } from "path";

import type { Application } from "../application";
import {
  ModuleReflection,
  ProjectReflection,
  SomeContainerReflection,
  SomeReflection,
  SomeType,
  UnknownType,
  IntrinsicType,
} from "../models/index";
import { ObjectReflection } from "../models/reflections/object";
import type { Options, Logger } from "../utils";
import { EventEmitter } from "../utils/event";
import { Context } from "./context";
import { addConverters, ReflectionConverter } from "./nodes";
import { addTypeConverters, TypeConverter } from "./types";
import { getCommonDirectory } from "../utils/fs";
import { getCommentForNodes } from "./comments";
import { discoverProjectInfo } from "./utils";

interface ConverterEventMap {
  begin: [ProjectReflection, ts.Program];
  reflectionCreated: [SomeReflection, ts.Symbol, ts.Node[]];
  moduleCreated: [ModuleReflection, ts.SourceFile];
  end: [ProjectReflection];
}

export class Converter extends EventEmitter<ConverterEventMap> {
  /** @event */
  static readonly EVENT_BEGIN = "begin";
  /** @event */
  static readonly EVENT_END = "end";

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
  static readonly EVENT_REFLECTION_CREATED = "reflectionCreated";

  /** @event */
  static readonly EVENT_MODULE_CREATED = "moduleCreated";

  get options(): Options {
    return this.application.options;
  }

  get logger(): Logger {
    return this.application.logger;
  }

  get checker(): ts.TypeChecker {
    assert(
      this._checker,
      "type checker may only be accessed while conversion is in progress."
    );
    return this._checker;
  }

  get project(): ProjectReflection {
    assert(
      this._project,
      "project may only be accessed while conversion is in progress."
    );
    return this._project;
  }

  private _checker?: ts.TypeChecker;
  private _project?: ProjectReflection;
  private _reflectionConverters = new Map<ts.SyntaxKind, ReflectionConverter>();
  private _typeNodeConverters = new Map<ts.SyntaxKind, TypeConverter>();

  constructor(readonly application: Application) {
    super();
    addConverters(this);
    addTypeConverters(this);
  }

  addReflectionConverter(converter: ReflectionConverter): void {
    for (const kind of converter.kind) {
      assert(
        !this._reflectionConverters.has(kind),
        `Duplicate converter for ${ts.SyntaxKind[kind]}`
      );
      this._reflectionConverters.set(kind, converter);
    }
  }

  addTypeNodeConverter(converter: TypeConverter): void {
    for (const kind of converter.kind) {
      assert(
        !this._reflectionConverters.has(kind),
        `Duplicate type node converter for ${ts.SyntaxKind[kind]}`
      );
      this._typeNodeConverters.set(kind, converter);
    }
  }

  async convert(
    program: ts.Program,
    entryPoints: string[]
  ): Promise<ProjectReflection> {
    const start = Date.now();
    const compilerOptions = program.getCompilerOptions();
    const rootDir = resolve(
      compilerOptions.baseUrl ??
        compilerOptions.rootDir ??
        getCommonDirectory(program.getRootFileNames())
    );
    this._checker = program.getTypeChecker();

    const { name, readme } = await discoverProjectInfo(
      rootDir,
      this.options.getValue("name"),
      this.options.getValue("readme"),
      this.options.getValue("includeVersion")
    );
    const project = (this._project = new ProjectReflection(name, readme));
    await this.emit(Converter.EVENT_BEGIN, project, program);

    const context = new Context(program, this, project, project);

    // Due to the order juggling necessary to only document each item once, the module
    // converter is not a standard converter.
    for (const entry of entryPoints) {
      const entryStart = Date.now();
      this.logger.verbose(`First pass: ${entry}`);

      const file = program.getSourceFile(entry);
      if (!file) {
        this.logger.error(
          `Failed to find source file for entry point ${entry}`
        );
        continue;
      }

      const name = relative(rootDir, file.fileName)
        .replace(/(\.d)?\.[tj]sx?$/, "")
        .replace(/\\/g, "/");

      const moduleReflection = new ModuleReflection(name);
      moduleReflection.comment = getCommentForNodes([file]);
      project.addChild(moduleReflection);
      await this.emit(Converter.EVENT_MODULE_CREATED, moduleReflection, file);
      for (const exportSymbol of this.getExportsOfModule(
        file,
        program.getTypeChecker()
      )) {
        await this.convertSymbol(
          exportSymbol,
          context.withContainer(moduleReflection)
        );
      }

      this.logger.verbose(
        `[Perf] Converting ${name} took ${Date.now() - entryStart}ms`
      );
    }

    await this.emit(Converter.EVENT_END, project);

    this._checker = undefined;
    this._project = undefined;
    this.logger.verbose(`[Perf] Conversion took ${Date.now() - start}ms`);
    return project;
  }

  async convertSymbol<U extends SomeContainerReflection>(
    symbol: ts.Symbol,
    context: Context<U>
  ): Promise<void> {
    this.logger.verbose(`Converting symbol: ${symbol.name}`);
    const kinds = new Set(symbol.getDeclarations()?.map((d) => d.kind));
    if (kinds.has(ts.SyntaxKind.ClassDeclaration)) {
      // This is the one form of declaration merging we do, merging classes and interfaces.
      kinds.delete(ts.SyntaxKind.InterfaceDeclaration);
    }
    if (kinds.has(ts.SyntaxKind.GetAccessor)) {
      // Not exactly declaration merging... we treat accessors as one API item.
      kinds.delete(ts.SyntaxKind.SetAccessor);
    }

    await Promise.all(
      [...kinds].map(async (kind) => {
        const converter = this._reflectionConverters.get(kind);
        if (!converter) {
          this.logger.verbose(
            `Missing converter for symbol ${symbol.name} with kind ${kind} (${ts.SyntaxKind[kind]})`
          );
          return;
        }
        const nodes =
          symbol.getDeclarations()?.filter((d) => d.kind === kind) ?? [];
        if (kind === ts.SyntaxKind.ClassDeclaration) {
          nodes.push(
            ...(symbol
              .getDeclarations()
              ?.filter((d) => d.kind === ts.SyntaxKind.InterfaceDeclaration) ??
              [])
          );
        }
        const child = await converter.convert(context, symbol, nodes);
        child.comment = getCommentForNodes(nodes);
        // TS isn't smart enough to know this is safe. The converters are carefully structured so that it is.
        context.container.addChild(child as any);
        await this.emit(
          Converter.EVENT_REFLECTION_CREATED,
          child,
          symbol,
          nodes
        );
      })
    );
  }

  async convertTypeOrObject(
    typeOrNode: ts.TypeNode | ts.Type | undefined
  ): Promise<SomeType | ObjectReflection> {
    // TODO: Fix this
    if (
      typeOrNode &&
      "kind" in typeOrNode &&
      ts.isTypeLiteralNode(typeOrNode)
    ) {
      this.logger.verbose("TODO Fix convertTypeOrObject");
      return new ObjectReflection("TODO", [], [], []);
    }

    return this.convertType(typeOrNode);
  }

  // Unlike convertSymbol, types aren't immediately interesting without being tied to something.
  // They don't emit events and thus can be converted synchronously.
  convertType = (typeOrNode: ts.TypeNode | ts.Type | undefined): SomeType => {
    assert(
      this._checker,
      "convertType may only be called when a call to convert is in progress."
    );

    if (typeOrNode == null) {
      return new IntrinsicType("any");
    }

    if ("kind" in typeOrNode) {
      const converter = this._typeNodeConverters.get(typeOrNode.kind);
      if (converter) {
        return converter.convert(this, typeOrNode);
      }
      this.logger.warn(
        `Missing type converter for kind ${typeOrNode.kind} (${
          ts.SyntaxKind[typeOrNode.kind]
        })`
      );
      return new UnknownType(typeOrNode.getText());
    }

    // IgnoreErrors is important, without it, we can't assert that we will get a node.
    const node = this._checker.typeToTypeNode(
      typeOrNode,
      void 0,
      ts.NodeBuilderFlags.IgnoreErrors
    );
    assert(node); // According to the TS source of typeToString, this is a bug if it does not hold.

    const converter = this._typeNodeConverters.get(node.kind);
    if (converter) {
      return converter.convertType(this, typeOrNode, node);
    }

    this.logger.warn(
      `Missing type converter for type: ${this._checker.typeToString(
        typeOrNode
      )}`
    );
    return new UnknownType(this._checker.typeToString(typeOrNode));
  };

  private getExportsOfModule(file: ts.SourceFile, checker: ts.TypeChecker) {
    // If this is a normal TS file using ES2015 modules, use the type checker.
    let symbol = checker.getSymbolAtLocation(file);

    if (!symbol && file.flags & ts.NodeFlags.JavaScriptFile) {
      // FIXME: It seems like there really ought to be a way to do this without relying on the internal symbol property.
      // we need to do this for CommonJS users with module.exports=, exports.foo= https://stackoverflow.com/q/62865648/7186598
      symbol = (file as any).symbol;
    }

    // Otherwise this isn't a module it is global and thus has no exports.
    return symbol ? checker.getExportsOfModule(symbol) : [];
  }
}
