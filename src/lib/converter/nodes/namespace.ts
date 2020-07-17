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

    await Promise.all(
      context
        .getExportsWithFlag(symbol, ts.SymbolFlags.ModuleMember)
        .map((child) =>
          context.converter.convertSymbol(
            child,
            context.withContainer(namespace)
          )
        )
    );

    return namespace;
  },
};
