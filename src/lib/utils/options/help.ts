import type { Options } from "./options";
import {
    ParameterHint,
    StringDeclarationOption,
    ParameterType,
    DeclarationOption,
} from "./declaration";
import { getSupportedLanguages } from "../highlighter";

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
        "hint" in parameter
    );
}

/**
 * Prepare parameter information for the [[toString]] method.
 *
 * @param scope  The scope of the parameters whose help should be returned.
 * @returns The columns and lines for the help of the requested parameters.
 */
function getParameterHelp(options: Options): ParameterHelp {
    const parameters = options.getDeclarations();
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

        let name = " --" + parameter.name;
        if (hasHint(parameter)) {
            name += " " + ParameterHint[parameter.hint].toUpperCase();
        }

        names.push(name);
        helps.push(parameter.help);
        margin = Math.max(name.length, margin);
    }

    return { names, helps, margin };
}

function toEvenColumns(values: string[], maxLineWidth: number) {
    const columnWidth =
        values.reduce((acc, val) => Math.max(acc, val.length), 0) + 2;

    const numColumns = Math.max(1, Math.min(maxLineWidth / columnWidth));
    let line = "";
    const out: string[] = [];

    for (let i = 0; i < values.length; ++i) {
        if (i !== 0 && i % numColumns === 0) {
            out.push(line);
            line = "";
        }
        line += values[i].padEnd(columnWidth);
    }
    if (line != "") {
        out.push(line);
    }

    return out;
}

export function getOptionsHelp(options: Options): string {
    const output = ["Usage:", "  typedoc path/to/entry.ts", "", "Options:"];

    const columns = getParameterHelp(options);
    for (let i = 0; i < columns.names.length; i++) {
        const usage = columns.names[i];
        const description = columns.helps[i];
        output.push(usage.padEnd(columns.margin + 2) + description);
    }

    output.push(
        "",
        "Supported highlighting languages:",
        ...toEvenColumns(getSupportedLanguages(), 80)
    );

    return output.join("\n");
}
