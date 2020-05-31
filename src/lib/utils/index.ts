/**
 * This type provides a flag that can be used to turn off more lax overloads intended for
 * plugin use only to catch type errors in the TypeDoc codebase. The prepublishOnly npm
 * script will be used to switch this flag to false when publishing, then immediately back
 * to true after a successful publish.
 */
type InternalOnly = true;

/**
 * Helper type to convert `T` to `F` if strict mode is on.
 *
 * Can be used in overloads to map a parameter type to `never`. For example, the
 * following function will work with any string argument, but to improve the type safety
 * of internal code, we only ever want to pass 'a' or 'b' to it. Plugins on the other
 * hand need to be able to pass any string to it. Overloads similar to this are used
 * in the {@link Options} class.
 *
 * ```ts
 * function over(flag: 'a' | 'b'): string
 * function over(flag: IfInternal<never, string>): string
 * function over(flag: string): string { return flag }
 * ```
 */
export type IfInternal<T, F> = InternalOnly extends true ? T : F;

/**
 * Helper type to convert `T` to `never` if strict mode is on.
 *
 * See {@link IfInternal} for the rationale.
 */
export type NeverIfInternal<T> = IfInternal<never, T>;

export {
    Options,
    ParameterType,
    ParameterHint,
    ParameterScope,
    BindOption,

    TypeDocAndTSOptions,
    TypeDocOptions,
} from './options';

export { insertOrderSorted, removeIfPresent } from './array';
export { Component, AbstractComponent, ChildableComponent } from './component';
export { Event, EventDispatcher } from './events';
export {
    normalizePath,
    directoryExists,
    ensureDirectoriesExist,
    readFile,
    expandDirectories,
} from './fs';
export { Logger, LogLevel, ConsoleLogger, CallbackLogger } from './loggers';
export { loadPlugins } from './plugins';
