import * as ts from "typescript";
import type { ReflectionConverter } from "./types";
import { MethodReflection } from "../../models";
import { convertSignatureDeclaration } from "./signature";
import { getVisibility } from "../utils";

export const methodConverter: ReflectionConverter<
  ts.MethodSignature | ts.MethodDeclaration,
  MethodReflection
> = {
  kind: [ts.SyntaxKind.MethodSignature, ts.SyntaxKind.MethodDeclaration],
  async convert(context, symbol, nodes) {
    // All signatures must have the same visibility.
    const container = new MethodReflection(
      symbol.name,
      getVisibility(nodes[0])
    );

    // With overloads, only the signatures without an implementation are "real"
    const includeImplementation = nodes.length === 1;

    const realNodes = nodes.filter(
      (node) =>
        ts.isMethodDeclaration(node) &&
        Boolean(node.body) === includeImplementation
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
