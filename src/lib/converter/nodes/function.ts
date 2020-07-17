import * as ts from "typescript";
import type { ReflectionConverter } from "./types";
import { FunctionReflection } from "../../models";
import { convertSignatureDeclaration } from "./signature";

export const functionConverter: ReflectionConverter<
  ts.FunctionDeclaration,
  FunctionReflection
> = {
  kind: [ts.SyntaxKind.FunctionDeclaration],
  async convert(context, symbol, nodes) {
    const container = new FunctionReflection(symbol.name);

    // With overloads, only the signatures without an implementation are real
    const skipImplementation = nodes.length > 1;

    for (const node of nodes) {
      if (node.body && skipImplementation) {
        continue;
      }
      container.signatures.push(
        await convertSignatureDeclaration(context.converter, symbol.name, node)
      );
    }

    return container;
  },
};
