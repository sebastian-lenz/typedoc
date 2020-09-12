import { join, resolve } from "path";
import { promises as fs } from "fs";
import * as ts from "typescript";
import * as M from "../models";
import type { Converter } from "./converter";
import { SomeType, TypeKind, Visibility } from "../models";

export function excludeUndefined(type: SomeType): SomeType {
  if (type.kind === TypeKind.Union) {
    const undefIndex = type.types.findIndex(
      (t) => t.kind === TypeKind.Intrinsic && t.name === "undefined"
    );
    if (undefIndex !== -1) {
      type.types.splice(undefIndex, 1);
    }

    if (type.types.length > 1) {
      return type;
    } else {
      return type.types[0];
    }
  }

  // If this isn't a union, nothing to exclude.
  return type;
}

export function convertTypeParameters(
  converter: Converter,
  parameters: readonly ts.TypeParameter[]
): M.TypeParameterType[] {
  return parameters.map((param) => {
    const constraintType = param.getConstraint();
    const constraint = constraintType
      ? converter.convertType(constraintType)
      : undefined;
    const defaultType = param.getDefault();
    const defaultValue = defaultType
      ? converter.convertType(defaultType)
      : undefined;

    return new M.TypeParameterType(param.symbol.name, constraint, defaultValue);
  });
}

export function convertParameterSymbols(
  converter: Converter,
  parameters: readonly ts.Symbol[]
): M.SignatureParameterType[] {
  return parameters.map((symbol) => {
    const type = converter.convertType(
      converter.checker.getTypeOfSymbolAtLocation(
        symbol,
        symbol.valueDeclaration
      )
    );
    return new M.SignatureParameterType(
      symbol.name,
      hasQuestionToken(symbol.valueDeclaration),
      hasDotDotDotToken(symbol.valueDeclaration as ts.ParameterDeclaration),
      type
    );
  });
}

export function convertTypeParameterDeclarations(
  converter: Converter,
  parameters: readonly ts.TypeParameterDeclaration[]
): M.TypeParameterType[] {
  return parameters.map((param) => {
    const constraint = param.constraint
      ? converter.convertType(param.constraint)
      : undefined;
    const defaultValue = param.default
      ? converter.convertType(param.default)
      : undefined;

    return new M.TypeParameterType(param.name.text, constraint, defaultValue);
  });
}

export function convertParameters(
  converter: Converter,
  parameters: readonly ts.ParameterDeclaration[]
): M.SignatureParameterType[] {
  return parameters.map((param, index) => {
    const name = ts.isIdentifier(param.name)
      ? param.name.text
      : `param${index}`;
    const type = converter.convertType(param.type);
    return new M.SignatureParameterType(
      name,
      hasQuestionToken(param),
      hasDotDotDotToken(param),
      type
    );
  });
}

export function hasReadonlyModifier(declaration?: ts.Declaration): boolean {
  return (
    declaration?.modifiers?.some(
      (mod) => mod.kind === ts.SyntaxKind.ReadonlyKeyword
    ) ?? false
  );
}

export function hasQuestionToken(declaration: ts.Declaration): boolean {
  return !!(declaration as any).questionToken;
}

export function hasDotDotDotToken(
  declaration: ts.ParameterDeclaration
): boolean {
  return !!declaration.dotDotDotToken;
}

export function getVisibility(
  declaration: ts.PropertyLikeDeclaration
): Visibility {
  for (const { kind } of declaration.modifiers ?? []) {
    if (kind === ts.SyntaxKind.PublicKeyword) {
      return Visibility.Public;
    } else if (kind === ts.SyntaxKind.ProtectedKeyword) {
      return Visibility.Protected;
    } else if (kind === ts.SyntaxKind.PrivateKeyword) {
      return Visibility.Private;
    }
  }
  return Visibility.Public;
}

/**
 * Helper to find the project name and readme.
 */
export async function discoverProjectInfo(
  rootDir: string,
  projectName: string,
  readmeFile: string,
  includeVersion: boolean
): Promise<{ name: string; readme: string }> {
  // Find package.json to discover the project name.
  let currentDir = resolve(rootDir);
  let packageFile = "";
  const filesFound = () => !!packageFile || !!readmeFile;
  const reachedTopDirectory = () =>
    currentDir === resolve(join(currentDir, ".."));

  while (!reachedTopDirectory() && !filesFound()) {
    const files = await fs.readdir(currentDir);
    for (const file of files) {
      const lowerFile = file.toLowerCase();
      if (!readmeFile && lowerFile === "readme.md") {
        readmeFile = join(currentDir, file);
      }

      if (!packageFile && lowerFile === "package.json") {
        packageFile = join(currentDir, file);
      }
    }
    currentDir = resolve(join(currentDir, ".."));
  }

  let name = projectName;

  if (packageFile) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageInfo: any = require(packageFile);
    if (!name) {
      name = String(packageInfo.name);
    }
    if (includeVersion) {
      name = `${name} - v${packageInfo.version}`;
    }
  }

  const readme =
    readmeFile && readmeFile !== "none"
      ? await fs.readFile(readmeFile, "utf-8")
      : "";

  return { name, readme };
}
