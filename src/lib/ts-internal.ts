import * as ts from "typescript";
const tsany = ts as any;

// If TypeDoc dropped support for allowing all of tsc's cli flags, this can all go.

export const optionDeclarations: CommandLineOption[] = tsany.optionDeclarations;

/**
 * Command line options
 *
 * https://github.com/Microsoft/TypeScript/blob/v2.1.4/src/compiler/types.ts#L3310
 */
export interface CommandLineOptionBase {
  name: string;
  /**
   * a value of a primitive type, or an object literal mapping named values to actual values
   */
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "list"
    | Map<number | string, any>;
  /**
   * True if option value is a path or fileName
   */
  isFilePath?: boolean;
  /**
   * A short mnemonic for convenience - for instance, 'h' can be used in place of 'help'
   */
  shortName?: string;
  /**
   * The message describing what the command line switch does
   */
  description?: ts.DiagnosticMessage;
  /**
   * The name to be used for a non-boolean option's parameter
   */
  paramType?: ts.DiagnosticMessage;
  experimental?: boolean;
  /**
   * True if option can only be specified via tsconfig.json file
   */
  isTSConfigOnly?: boolean;
}

export interface CommandLineOptionOfPrimitiveType
  extends CommandLineOptionBase {
  type: "string" | "number" | "boolean";
}

export interface CommandLineOptionOfCustomType extends CommandLineOptionBase {
  type: Map<number | string, any>; // an object literal mapping named values to actual values
}

export interface TsConfigOnlyOption extends CommandLineOptionBase {
  type: "object";
}

export interface CommandLineOptionOfListType extends CommandLineOptionBase {
  type: "list";
  element: CommandLineOptionOfCustomType | CommandLineOptionOfPrimitiveType;
}

export type CommandLineOption =
  | CommandLineOptionOfCustomType
  | CommandLineOptionOfPrimitiveType
  | TsConfigOnlyOption
  | CommandLineOptionOfListType;
