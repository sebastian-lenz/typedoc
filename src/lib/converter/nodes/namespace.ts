import * as ts from "typescript";
import type { ReflectionConverter } from "./types";
import { NamespaceReflection } from "../../models";

export const namespaceConverter: ReflectionConverter<
  ts.NamespaceDeclaration,
  NamespaceReflection
> = {
  kind: [ts.SyntaxKind.ModuleDeclaration],
  async convert(context, symbol) {
    const namespace = new NamespaceReflection(symbol.name);
    context.project.registerReflection(namespace, symbol);

    await context.convertChildren(
      context.getExportsWithFlag(symbol, ts.SymbolFlags.ModuleMember),
      namespace
    );

    return namespace;
  },
};
