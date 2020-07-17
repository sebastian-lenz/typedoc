import type * as ts from "typescript";
import type {
  ContainerReflection,
  IndependentReflection,
  SomeContainerReflection,
  ProjectReflection,
} from "../models";
import type { Converter } from "./converter";

export class Context<
  Container extends ContainerReflection<IndependentReflection>
> {
  get checker(): ts.TypeChecker {
    return this.program.getTypeChecker();
  }

  getExportsOfKind(
    symbol: ts.Symbol,
    kind: ts.SyntaxKind | ts.SyntaxKind[]
  ): ts.Symbol[] {
    const kinds = Array.isArray(kind) ? kind : [kind];
    const result: ts.Symbol[] = [];
    symbol.exports?.forEach((child) => {
      if (child.getDeclarations()?.some((decl) => kinds.includes(decl.kind))) {
        result.push(child);
      }
    });
    return result;
  }

  getExportsWithFlag(symbol: ts.Symbol, flag: ts.SymbolFlags): ts.Symbol[] {
    const result: ts.Symbol[] = [];
    symbol.exports?.forEach((child) => {
      if (child.flags & flag) {
        result.push(child);
      }
    });
    return result;
  }

  withContainer<U extends SomeContainerReflection>(container: U): Context<U> {
    return new Context(this.program, this.converter, this.project, container);
  }

  constructor(
    readonly program: ts.Program,
    readonly converter: Converter,
    readonly project: ProjectReflection,
    readonly container: Container
  ) {}
}
