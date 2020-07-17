import * as ts from "typescript";

import { Options } from "./options";
import {
  ParameterScope,
  ParameterHint,
  StringDeclarationOption,
  ParameterType,
  DeclarationOption,
} from "./declaration";

export interface ParameterHelp {
  names: string[];
  helps: string[];
  margin: number;
}

function hasHint(
  parameter: DeclarationOption
): parameter is StringDeclarationOption & { hint: ParameterHint } {
  return (
    (parameter.type ?? ParameterType.String) === ParameterType.String &&
    typeof (parameter as StringDeclarationOption).hint !== "undefined"
  );
}

/**
 * Prepare parameter information for the [[toString]] method.
 *
 * @param scope  The scope of the parameters whose help should be returned.
 * @returns The columns and lines for the help of the requested parameters.
 */
function getParameterHelp(
  options: Options,
  scope: ParameterScope
): ParameterHelp {
  const parameters = options.getDeclarationsByScope(scope);
  parameters.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  const names: string[] = [];
  const helps: string[] = [];
  let margin = 0;

  for (const parameter of parameters) {
    if (!parameter.help) {
      continue;
    }

    let name = " ";
    if (parameter.short) {
      name += "-" + parameter.short;
      if (hasHint(parameter)) {
        name += " " + ParameterHint[parameter.hint].toUpperCase();
      }
      name += ", ";
    }

    name += "--" + parameter.name;
    if (hasHint(parameter)) {
      name += " " + ParameterHint[parameter.hint].toUpperCase();
    }

    names.push(name);
    helps.push(parameter.help);
    margin = Math.max(name.length, margin);
  }

  return { names, helps, margin };
}

/**
 * Print some usage information.
 *
 * Taken from TypeScript (src/compiler/tsc.ts)
 */
export function getOptionsHelp(options: Options): string {
  const typeDoc = getParameterHelp(options, ParameterScope.TypeDoc);

  const output: string[] = [];
  output.push("Usage:");
  output.push(
    " typedoc --mode modules --out path/to/documentation path/to/sourcefiles"
  );

  output.push("", "TypeDoc options:");
  pushHelp(typeDoc);

  output.push("", "TypeScript options:");
  output.push(
    "  See https://www.typescriptlang.org/docs/handbook/compiler-options.html"
  );

  output.push("");
  return output.join(ts.sys.newLine);

  function pushHelp(columns: ParameterHelp) {
    for (let i = 0; i < columns.names.length; i++) {
      const usage = columns.names[i];
      const description = columns.helps[i];
      output.push(
        usage + padding(typeDoc.margin - usage.length + 2) + description
      );
    }
  }

  function padding(length: number): string {
    return Array(length + 1).join(" ");
  }
}
