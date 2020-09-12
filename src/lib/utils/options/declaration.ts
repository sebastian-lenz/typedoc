import type { CompilerOptions } from "typescript";
import type { IgnoredTsOptionKeys } from "./sources/typescript";
import type { LogLevel } from "../loggers";

/**
 * An interface describing all TypeDoc specific options options. Generated from a
 * map which contains more information about each option for better types when
 * defining said options.
 */
export type TypeDocOptions = {
  [K in keyof TypeDocOptionMap]: TypeDocOptionMap[K] extends Record<
    string,
    infer U
  >
    ? Exclude<U, string> | keyof TypeDocOptionMap[K]
    : TypeDocOptionMap[K];
};

/**
 * Describes all TypeDoc specific options as returned by {@link Options.getValue}, this is
 * slightly more restrictive than the {@link TypeDocOptions} since it does not allow both
 * keys and values for mapped option types.
 */
export type TypeDocOptionValues = {
  [K in keyof TypeDocOptionMap]: TypeDocOptionMap[K] extends Record<
    string,
    infer U
  >
    ? Exclude<U, string>
    : TypeDocOptionMap[K];
};

/**
 * The CompilerOptions interface includes an index signature to avoid errors when unknown
 * options are passed. TypeDoc's option parsing is stricter, so we need to remove it.
 *
 * @see https://github.com/Microsoft/TypeScript/issues/25987#issuecomment-408339599
 */
type KnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K;
} extends { [_ in keyof T]: infer U }
  ? U
  : never;

/**
 * All supported options, includes both TypeDoc and TypeScript options.
 */
export type TypeDocAndTSOptions = TypeDocOptions &
  Pick<
    CompilerOptions,
    Exclude<KnownKeys<CompilerOptions>, IgnoredTsOptionKeys>
  >;

/**
 * Describes all TypeDoc options. Used internally to provide better types when fetching options.
 * External consumers should likely use either [[TypeDocAndTSOptions]] or [[TypeDocOptions]].
 */
export interface TypeDocOptionMap {
  // Where to get options
  options: string;
  tsconfig: string;

  // What to document
  entryPoint: string[];
  exclude: string[];

  excludeExternals: boolean; // If set, ignore node_modules
  excludePrivate: boolean;
  excludeProtected: boolean;
  excludeNotDocumented: boolean;

  // HTML generation
  html: string;
  includes: string;
  media: string;
  theme: string;
  cleanOutputDir: boolean;

  hideGenerator: boolean;
  gaID: string;
  gaSite: string;

  // JSON generation
  json: string;

  // Modify generated reflections
  name: string; // Set project name
  includeVersion: boolean; // Append version from package.json to project name
  excludeTags: string[]; // Remove some tags from comments when parsing
  readme: string; // Specify the path to the project readme

  disableSources: boolean; // Don't generate the sources key
  gitRevision: string; // Specify the git revision to link to (commit-ish)
  gitRemote: string; // Specify the git remote to link to (origin)

  // TODO: Not really clear on how these ought to work yet. Need to write the categorization
  // code to figure it out.
  categorizeByGroup: boolean;
  defaultCategory: string;
  categoryOrder: string[];

  // Miscellaneous
  help: boolean; // Print help + exit
  version: boolean; // Print version + exit
  plugin: string[]; // Specify plugins to load
  logger: unknown; // string | Function - specify what logger to use.
  logLevel: typeof LogLevel; // Which log messages should be printed?
}

/**
 * Converts a given TypeDoc option key to the type of the declaration expected.
 */
export type KeyToDeclaration<
  K extends keyof TypeDocOptionMap
> = TypeDocOptionMap[K] extends boolean
  ? BooleanDeclarationOption
  : TypeDocOptionMap[K] extends string
  ? StringDeclarationOption
  : TypeDocOptionMap[K] extends number
  ? NumberDeclarationOption
  : TypeDocOptionMap[K] extends string[]
  ? ArrayDeclarationOption
  : unknown extends TypeDocOptionMap[K]
  ? MixedDeclarationOption
  : TypeDocOptionMap[K] extends Record<string | number, infer U>
  ? MapDeclarationOption<U>
  : never;

export enum ParameterHint {
  File,
  Directory,
}

export enum ParameterType {
  String,
  Number,
  Boolean,
  Map,
  Mixed,
  Array,
}

export enum ParameterScope {
  TypeDoc,
  TypeScript,
}

export interface DeclarationOptionBase {
  /**
   * The option name.
   */
  name: string;

  /**
   * An optional short name for the option.
   */
  short?: string;

  /**
   * The help text to be displayed to the user when --help is passed.
   */
  help: string;

  /**
   * The parameter type, used to convert user configuration values into the expected type.
   * If not set, the type will be a string.
   */
  type?: ParameterType;

  /**
   * Whether the option belongs to TypeDoc or TypeScript.
   * If not specified will be defaulted to TypeDoc.
   */
  scope?: ParameterScope;
}

export interface StringDeclarationOption extends DeclarationOptionBase {
  type?: ParameterType.String;

  /**
   * If not specified defaults to the empty string.
   */
  defaultValue?: string;

  /**
   * An optional hint for the type of input expected, will be displayed in the help output.
   */
  hint?: ParameterHint;
}

export interface NumberDeclarationOption extends DeclarationOptionBase {
  type: ParameterType.Number;

  /**
   * Lowest possible value.
   */
  minValue?: number;

  /**
   * Highest possible value.
   */
  maxValue?: number;

  /**
   * If not specified defaults to 0.
   */
  defaultValue?: number;
}

export interface BooleanDeclarationOption extends DeclarationOptionBase {
  type: ParameterType.Boolean;

  /**
   * If not specified defaults to false.
   */
  defaultValue?: boolean;
}

export interface ArrayDeclarationOption extends DeclarationOptionBase {
  type: ParameterType.Array;

  /**
   * If not specified defaults to an empty array.
   */
  defaultValue?: string[];
}

export interface MixedDeclarationOption extends DeclarationOptionBase {
  type: ParameterType.Mixed;

  /**
   * If not specified defaults to undefined.
   */
  defaultValue?: unknown;
}

export interface MapDeclarationOption<T> extends DeclarationOptionBase {
  type: ParameterType.Map;
  /**
   * Maps a given value to the option type. The map type may be a TypeScript enum.
   * In that case, when generating an error message for a mismatched key, the numeric
   * keys will not be listed.
   */
  map: Map<string, T> | Record<string | number, T>;

  /**
   * Unlike the rest of the option types, there is no sensible generic default for mapped option types.
   * The default value for a mapped type must be specified.
   */
  defaultValue: T;

  /**
   * Optional override for the error reported when an invalid key is provided.
   */
  mapError?: string;
}

export type DeclarationOption =
  | StringDeclarationOption
  | NumberDeclarationOption
  | BooleanDeclarationOption
  | MixedDeclarationOption
  | MapDeclarationOption<unknown>
  | ArrayDeclarationOption;

export type DeclarationOptionToOptionType<
  T extends DeclarationOption
> = T extends StringDeclarationOption
  ? string
  : T extends NumberDeclarationOption
  ? number
  : T extends BooleanDeclarationOption
  ? boolean
  : T extends MixedDeclarationOption
  ? unknown
  : T extends MapDeclarationOption<infer U>
  ? U
  : T extends ArrayDeclarationOption
  ? string[]
  : never;

/**
 * The default conversion function used by the Options container. Readers may
 * re-use this conversion function or implement their own. The arguments reader
 * implements its own since 'false' should not be converted to true for a boolean option.
 * @param value The value to convert.
 * @param option The option for which the value should be converted.
 * @returns The result of the conversion. Might be the value or an error.
 */
export function convert<T extends DeclarationOption>(
  value: unknown,
  option: T
): DeclarationOptionToOptionType<T>;
export function convert<T extends DeclarationOption>(
  value: unknown,
  option: T
): unknown {
  switch (option.type) {
    case undefined:
    case ParameterType.String:
      return value == null ? "" : String(value);
    case ParameterType.Number: {
      const numberOption = option as NumberDeclarationOption;
      const numValue = parseInt(String(value), 10) || 0;
      if (
        !valueIsWithinBounds(
          numValue,
          numberOption.minValue,
          numberOption.maxValue
        )
      ) {
        throw new Error(
          getBoundsError(
            numberOption.name,
            numberOption.minValue,
            numberOption.maxValue
          )
        );
      }
      return numValue;
    }
    case ParameterType.Boolean:
      return Boolean(value);
    case ParameterType.Array:
      if (Array.isArray(value)) {
        return value.map(String);
      } else if (typeof value === "string") {
        return value.split(",");
      }
      return [];
    case ParameterType.Map: {
      const optionMap = option as MapDeclarationOption<unknown>;
      const key = String(value).toLowerCase();
      if (optionMap.map instanceof Map) {
        if (optionMap.map.has(key)) {
          return optionMap.map.get(key);
        }
        if ([...optionMap.map.values()].includes(value)) {
          return value;
        }
      } else {
        if (key in optionMap.map) {
          return optionMap.map[key];
        }
        if (Object.values(optionMap.map).includes(value)) {
          return value;
        }
      }
      throw new Error(
        optionMap.mapError ?? getMapError(optionMap.map, optionMap.name)
      );
    }
    case ParameterType.Mixed:
      return value;
  }
}

/**
 * Returns an error message for a map option, indicating that a given value was not one of the values within the map.
 * @param map The values for the option.
 * @param name The name of the option.
 * @returns The error message.
 */
function getMapError(
  map: MapDeclarationOption<unknown>["map"],
  name: string
): string {
  let keys = map instanceof Map ? [...map.keys()] : Object.keys(map);
  const getString = (key: string) =>
    String(map instanceof Map ? map.get(key) : map[key]);

  // If the map is a TS numeric enum we need to filter out the numeric keys.
  // TS numeric enums have the property that every key maps to a value, which maps back to that key.
  if (
    !(map instanceof Map) &&
    keys.every((key) => getString(getString(key)) === key)
  ) {
    // This works because TS enum keys may not be numeric.
    keys = keys.filter((key) => Number.isNaN(parseInt(key, 10)));
  }

  return `${name} must be one of ${keys.join(", ")}`;
}

/**
 * Returns an error message for a value that is out of bounds of the given min and/or max values.
 * @param name The name of the thing the value represents.
 * @param minValue The lower bound of the range of allowed values.
 * @param maxValue The upper bound of the range of allowed values.
 * @returns The error message.
 */
function getBoundsError(
  name: string,
  minValue?: number,
  maxValue?: number
): string {
  if (isFiniteNumber(minValue) && isFiniteNumber(maxValue)) {
    return `${name} must be between ${minValue} and ${maxValue}`;
  } else if (isFiniteNumber(minValue)) {
    return `${name} must be >= ${minValue}`;
  } else if (isFiniteNumber(maxValue)) {
    return `${name} must be <= ${maxValue}`;
  }
  throw new Error("Unreachable");
}

/**
 * Checks if the given value is a finite number.
 * This is equivalent to Number.isFinite, but that function is incorrectly typed to only accept
 * `number` in the latest TS version. See TypeScript/34932
 * @param value The value being checked.
 * @returns True, if the value is a finite number, otherwise false.
 */
function isFiniteNumber(value?: unknown): value is number {
  return typeof value === "number" && isFinite(value);
}

/**
 * Checks if a value is between the bounds of the given min and/or max values.
 * @param value The value being checked.
 * @param minValue The lower bound of the range of allowed values.
 * @param maxValue The upper bound of the range of allowed values.
 * @returns True, if the value is within the given bounds, otherwise false.
 */
function valueIsWithinBounds(
  value: number,
  minValue?: number,
  maxValue?: number
): boolean {
  if (isFiniteNumber(minValue) && isFiniteNumber(maxValue)) {
    return minValue <= value && value <= maxValue;
  } else if (isFiniteNumber(minValue)) {
    return minValue <= value;
  } else if (isFiniteNumber(maxValue)) {
    return value <= maxValue;
  } else {
    return true;
  }
}
