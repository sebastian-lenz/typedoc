import * as assert from "assert";
import * as ts from "typescript";
import type { ReflectionConverter } from "./types";
import { ReferenceType, ClassReflection } from "../../models";
import { convertSignatureDeclaration } from "./signature";
import { convertTypeParameterDeclarations } from "../utils";

// TODO: GERRIT This and the interface implementation can be simplified / merged.

export const classConverter: ReflectionConverter<
  ts.ClassDeclaration,
  ClassReflection
> = {
  kind: [ts.SyntaxKind.ClassDeclaration],
  async convert(context, symbol, [node]) {
    const signatureSymbol = symbol.members?.get("__call" as ts.__String);
    const signatures = await Promise.all(
      signatureSymbol
        ?.getDeclarations()
        ?.filter(ts.isCallSignatureDeclaration)
        .map((node) =>
          convertSignatureDeclaration(context.converter, "__call", node)
        ) ?? []
    );

    const constructSymbol = symbol.members?.get("__new" as ts.__String);
    const constructSignatures = await Promise.all(
      constructSymbol
        ?.getDeclarations()
        ?.filter(ts.isCallSignatureDeclaration)
        .map((node) =>
          convertSignatureDeclaration(context.converter, "__new", node)
        ) ?? []
    );

    const implementsClause = node.heritageClauses?.find(
      (clause) => clause.token === ts.SyntaxKind.ImplementsKeyword
    );

    const implementedTypes =
      implementsClause?.types.map((type) => {
        const parent = context.converter.convertType(type);
        assert(parent instanceof ReferenceType);
        return parent;
      }) ?? [];

    const extendsClause = node.heritageClauses?.find(
      (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword
    );
    const extendedType = extendsClause
      ? context.converter.convertType(extendsClause.types[0])
      : undefined;

    const typeParameterSymbols: ts.Symbol[] = [];
    const members: ts.Symbol[] = [];
    symbol.members?.forEach((member) => {
      if (member.flags & ts.TypeFlags.TypeParameter) {
        typeParameterSymbols.push(member);
        // We already took care of signatures and construct signatures.
      } else if (member.flags & ts.SymbolFlags.FunctionExcludes) {
        members.push(member);
      }
    });

    const typeParameters = convertTypeParameterDeclarations(
      context.converter,
      typeParameterSymbols.map((symbol) => {
        const param = symbol.getDeclarations()?.[0];
        assert(param && ts.isTypeParameterDeclaration(param));
        return param;
      })
    );

    const reflection = new ClassReflection(
      symbol.name,
      signatures,
      constructSignatures,
      typeParameters,
      implementedTypes,
      extendedType
    );

    await Promise.all(
      members.map((child) =>
        context.converter.convertSymbol(
          child,
          context.withContainer(reflection)
        )
      )
    );

    return reflection;
  },
};
