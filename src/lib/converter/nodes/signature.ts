import * as assert from "assert";
import * as ts from "typescript";
import { SignatureReflection, ParameterReflection } from "../../models";
import type { Converter } from "../converter";
import { getCommentForNodes } from "../comments";
import { convertTypeParameters, excludeUndefined } from "../utils";
import { waterfall } from "../../utils/array";

export async function convertSignatureDeclaration(
  converter: Converter,
  name: string,
  node: ts.SignatureDeclaration,
  symbol: ts.Symbol
): Promise<SignatureReflection> {
  const signature = converter.checker.getSignatureFromDeclaration(node);
  assert(
    signature,
    `Failed to get a signature for ${name}. This is likely a bug.`
  );

  const returnType = await converter.convertTypeOrObject(
    node.type ?? signature.getReturnType()
  );

  const parameters = await waterfall(signature.parameters, async (param) => {
    const paramDeclaration = param.valueDeclaration;
    assert(paramDeclaration && ts.isParameter(paramDeclaration)); // Should never fail...

    const paramType = await converter.convertTypeOrObject(
      paramDeclaration.type ??
        converter.checker.getTypeOfSymbolAtLocation(param, paramDeclaration)
    );
    const isOptional =
      !!paramDeclaration.questionToken || !!paramDeclaration.initializer;

    const parameter = new ParameterReflection(
      param.name,
      "kind" in paramType || !isOptional
        ? paramType
        : excludeUndefined(paramType),
      paramDeclaration.initializer?.getText(),
      isOptional,
      !!paramDeclaration.dotDotDotToken
    );
    parameter.comment = getCommentForNodes([paramDeclaration]);

    return parameter;
  });

  const typeParameters = convertTypeParameters(
    converter,
    signature.getTypeParameters() ?? []
  );

  const reflection = new SignatureReflection(
    name,
    returnType,
    parameters,
    typeParameters
  );
  converter.project.registerReflection(reflection, symbol);
  reflection.parameters.forEach((param) => (param.parent = reflection));
  // Since we don't go through the converter, we have to set our own comment.
  reflection.comment = getCommentForNodes([node]);

  return reflection;
}
