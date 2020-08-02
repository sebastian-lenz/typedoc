import * as assert from "assert";
import * as ts from "typescript";
import { SignatureReflection, ParameterReflection } from "../../models";
import type { Converter } from "../converter";
import { getCommentForNodes } from "../comments";
import { convertTypeParameters } from "../utils";
import { waterfall } from "../../utils/array";

export async function convertSignatureDeclaration(
  converter: Converter,
  name: string,
  node: ts.SignatureDeclaration
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

    const parameter = new ParameterReflection(
      param.name,
      paramType,
      paramDeclaration.initializer?.getText(),
      !!paramDeclaration.questionToken || !!paramDeclaration.initializer,
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
  reflection.parameters.forEach((param) => (param.parent = reflection));
  // Since we don't go through the converter, we have to set our own comment.
  reflection.comment = getCommentForNodes([node]);

  return reflection;
}
