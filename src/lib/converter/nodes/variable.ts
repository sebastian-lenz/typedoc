import * as ts from "typescript";
import type { ReflectionConverter } from "./types";
import { VariableReflection } from "../../models";

export const variableConverter: ReflectionConverter<
  ts.VariableDeclaration,
  VariableReflection
> = {
  kind: [ts.SyntaxKind.VariableDeclaration],
  async convert(context, symbol, [node]) {
    const defaultValue = node.initializer?.getText();

    // TODO: Possibly convert as a function.
    return new VariableReflection(
      symbol.name,
      context.converter.convertType(
        node.type ?? context.checker.getTypeOfSymbolAtLocation(symbol, node)
      ),
      defaultValue
    );
  },
};
