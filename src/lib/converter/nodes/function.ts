import * as ts from "typescript";
import type { ReflectionConverter } from "./types";
import { FunctionReflection } from "../../models";
import { convertSignatureDeclaration } from "./signature";
import { waterfall } from "../../utils/array";

export const functionConverter: ReflectionConverter<
  ts.FunctionDeclaration,
  FunctionReflection
> = {
  kind: [ts.SyntaxKind.FunctionDeclaration],
  async convert(context, symbol, nodes) {
    const container = new FunctionReflection(symbol.name);
    context.project.registerReflection(container, symbol);

    // With overloads, only the signatures without an implementation are real
    const includeImplementation = nodes.length === 1;

    const realNodes = nodes.filter(
      (node) => Boolean(node.body) === includeImplementation
    );

    const signatures = await waterfall(realNodes, (node) =>
      convertSignatureDeclaration(context.converter, symbol.name, node, symbol)
    );

    for (const signature of signatures) {
      container.addChild(signature);
    }

    return container;
  },
};
