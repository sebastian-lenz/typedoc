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
    const skipImplementation = nodes.length > 1;

    for (const node of nodes) {
      if (ts.isMethodDeclaration(node) && node.body && skipImplementation) {
        continue;
      }
      container.signatures.push(
        await convertSignatureDeclaration(context.converter, symbol.name, node)
      );
    }

    return container;
  },
};
