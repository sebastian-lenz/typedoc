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
    const includeImplementation = nodes.length === 1;

    const realNodes = nodes.filter(
      (node) => Boolean(node.body) === includeImplementation
    );

    const signatures = await Promise.all(
      realNodes.map(
        convertSignatureDeclaration.bind(null, context.converter, symbol.name)
      )
    );

    for (const signature of signatures) {
      container.addChild(signature);
    }

    return container;
  },
};
