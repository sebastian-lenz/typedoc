import * as ts from "typescript";
import type { ReflectionConverter } from "./types";
import { TypeAliasReflection } from "../../models";
import { convertTypeParameterDeclarations } from "../utils";

export const aliasConverter: ReflectionConverter<
  ts.TypeAliasDeclaration,
  TypeAliasReflection
> = {
  kind: [ts.SyntaxKind.TypeAliasDeclaration],
  async convert(context, symbol, [node]) {
    return new TypeAliasReflection(
      symbol.name,
      await context.converter.convertTypeOrObject(node.type),
      convertTypeParameterDeclarations(
        context.converter,
        node.typeParameters ?? []
      )
    );
  },
};
