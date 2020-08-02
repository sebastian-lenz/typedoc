import * as ts from "typescript";
import type { ReflectionConverter } from "./types";
import { NamespaceReflection } from "../../models";

export const sourcefileConverter: ReflectionConverter<
  ts.SourceFile,
  NamespaceReflection
> = {
  kind: [ts.SyntaxKind.SourceFile],
  async convert(context, symbol) {
    const namespace = new NamespaceReflection(symbol.name);
    context.project.registerReflection(namespace, symbol);
    await context.convertChildren(context.getExports(symbol), namespace);
    return namespace;
  },
};
