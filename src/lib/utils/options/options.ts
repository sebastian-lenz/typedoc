import * as _ from 'lodash';
import * as ts from 'typescript';

import { DeclarationOption, ParameterScope, ParameterType, convert, TypeDocOptions, KeyToDeclaration, TypeDocAndTSOptions, TypeDocOptionMap } from './declaration';
import { Logger } from '../loggers';
import { insertPrioritySorted } from '../array';
import { addTSOptions, addTypeDocOptions } from './sources';
import { Application } from '../../..';
import { NeverIfInternal } from '..';

/**
 * Describes an option reader that discovers user configuration and converts it to the
 * TypeDoc format.
 */
export interface OptionsReader {
    /**
     * Readers will be processed according to their priority.
     * A higher priority indicates that the reader should be called *later* so that
     * it can override options set by lower priority readers.
     *
     * Note that to preserve expected behavior, the argv reader must have both the lowest
     * priority so that it may set the location of config files used by other readers and
     * the highest priority so that it can override settings from lower priority readers.
     */
    priority: number;

    /**
     * The name of this reader so that it may be removed by plugins without the plugin
     * accessing the instance performing the read. Multiple readers may have the same
     * name.
     */
    name: string;

    /**
     * Read options from the reader's source and place them in the options parameter.
     * Options without a declared name may be treated as if they were declared with type
     * [[ParameterType.Mixed]]. Options which have been declared must be converted to the
     * correct type. As an alternative to doing this conversion in the reader,
     * the reader may use [[Options.setValue]], which will correctly convert values.
     * @param options
     * @param compilerOptions
     * @param container the options container that provides declarations
     * @param logger
     */
    read(container: Options, logger: Logger): void;
}

/**
 * Maintains a collection of option declarations split into TypeDoc options
 * and TypeScript options. Ensures options are of the correct type for calling
 * code.
 *
 * ### Case Sensitivity
 * All option keys are case insensitive. The following lines will each get the same value.
 * ```ts
 * const x = options.getValue('name');
 * const y = options.getValue('NAME');
 * const z = options.tryGetValue('NaMe').unwrap();
 * ```
 *
 * **WARNING**: This case insensitivity is primarily intended to ease command line use and for
 * backward compatibility. It may change in a future release. Any code using TypeDoc options
 * programmatically should conform to the case indicated in the [[TypeDocOptions]] interface.
 *
 * ### Option Discovery
 *
 * Since plugins commonly add custom options, and TypeDoc does not permit options which have
 * not been declared to be set, options must be read twice. The first time options are read,
 * a noop logger is passed so that any errors are ignored. Then, after loading plugins, options
 * are read again, this time with the logger specified by the application.
 *
 * Options are read in a specific order.
 * 1. argv (0) - Must be read first since it should change the files read when
 *    passing --options or --tsconfig.
 * 2. typedoc-json (100) - Read next so that it can specify the tsconfig.json file to read.
 * 3. tsconfig-json (200) - Last config file reader, cannot specify the typedoc.json file to read.
 * 4. argv (300) - Read argv again since any options set there should override those set in config
 *    files.
 */
export class Options {
    private _readers: OptionsReader[] = [];
    private _declarations = new Map<string, Readonly<DeclarationOption>>();
    private _values: Partial<TypeDocOptions> = {};
    private _compilerOptions: ts.CompilerOptions = {};
    private _logger: Logger;

    constructor(logger: Logger) {
        this._logger = logger;
    }

    /**
     * Sets the logger used when an option declaration fails to be added.
     * @param logger
     */
    setLogger(logger: Logger) {
        this._logger = logger;
    }

    /**
     * Adds the option declarations declared by the TypeDoc and all supported TypeScript declarations.
     */
    addDefaultDeclarations() {
        addTSOptions(this);
        addTypeDocOptions(this);
    }

    /**
     * Resets the option bag to all default values.
     */
    reset() {
        for (const declaration of this._declarations.values()) {
            this.setOptionValueToDefault(declaration);
        }
        this._compilerOptions = {};
    }

    /**
     * Adds an option reader that will be used to read configuration values
     * from the command line, configuration files, or other locations.
     * @param reader
     */
    addReader(reader: OptionsReader): void {
        insertPrioritySorted(this._readers, reader);
    }

    /**
     * Removes all readers of a given name.
     * @param name
     */
    removeReaderByName(name: string): void {
        this._readers = this._readers.filter(reader => reader.name !== name);
    }

    read(logger: Logger) {
        for (const reader of this._readers) {
            reader.read(this, logger);
        }
    }

    /**
     * Adds an option declaration to the container with extra type checking to ensure that
     * the runtime type is consistent with the declared type.
     * @param declaration
     */
    addDeclaration<K extends keyof TypeDocOptions>(declaration: { name: K } & KeyToDeclaration<K>): void;

    /**
     * Adds an option declaration to the container.
     * @param declaration
     */
    addDeclaration(declaration: NeverIfInternal<Readonly<DeclarationOption>>): void;

    addDeclaration(declaration: Readonly<DeclarationOption>): void {
        const names = [declaration.name];
        if (declaration.short) {
            names.push(declaration.short);
        }

        for (const name of names) {
            // Check for registering the same declaration twice, should not be an error.
            const decl = this.getDeclaration(name);
            if (decl && decl !== declaration) {
                this._logger.error(`The option ${name} has already been registered`);
            } else {
                this._declarations.set(name.toLowerCase(), declaration);
            }
        }

        this.setOptionValueToDefault(declaration);
    }

    /**
     * Adds the given declarations to the container
     * @param declarations
     *
     * @privateRemarks
     * This function explicitly provides a way out of the strict typing enforced
     * by {@link addDeclaration}. It should only be used with careful validation
     * of the declaration map. Internally, it is only used for adding TS options
     */
    addDeclarations(declarations: readonly DeclarationOption[]): void {
        for (const decl of declarations) {
            this.addDeclaration(decl as any);
        }
    }

    /**
     * Removes a declared option.
     * WARNING: This is probably a bad idea. If you do this you will probably cause a crash
     * when code assumes that an option that it declared still exists.
     * @param name
     */
    removeDeclarationByName(name: string): void {
        const declaration = this.getDeclaration(name);
        if (declaration) {
            this._declarations.delete(declaration.name.toLowerCase());
            if (declaration.short) {
                this._declarations.delete(declaration.short.toLowerCase());
            }
            delete this._values[declaration.name];
        }
    }

    /**
     * Gets a declaration by either its name or short name.
     * @param name
     */
    getDeclaration(name: string): Readonly<DeclarationOption> | undefined {
        return this._declarations.get(name.toLowerCase());
    }

    /**
     * Gets all declarations in the options with a given scope.
     * @param scope
     */
    getDeclarationsByScope(scope: ParameterScope) {
        return _.uniq(Array.from(this._declarations.values()))
            .filter(declaration => (declaration.scope ?? ParameterScope.TypeDoc) === scope);
    }

    /**
     * Checks if the given option has a set value or if the value is the default value.
     * @param name
     */
    isDefault(name: keyof TypeDocOptions): boolean;
    isDefault(name: NeverIfInternal<string>): boolean;
    isDefault(name: string): boolean {
        // getValue will throw if the declaration does not exist.
        return this.getValue(name as keyof TypeDocOptions) === this.getDeclaration(name)!.defaultValue;
    }

    /**
     * Gets all of the TypeDoc option values defined in this option container.
     */
    getRawValues(): Partial<TypeDocOptions> {
        return _.cloneDeep(this._values);
    }

    /**
     * Gets a value for the given option key, throwing if the option has not been declared.
     * @param name
     */
    getValue<K extends keyof TypeDocOptions>(name: K): TypeDocOptions[K];
    getValue(name: NeverIfInternal<string>): unknown;
    getValue(name: string): unknown {
        const declaration = this.getDeclaration(name);
        if (!declaration) {
            throw new Error(`Unknown option '${name}'`);
        }

        if (declaration.scope === ParameterScope.TypeScript) {
            throw new Error('TypeScript options must be fetched with getCompilerOptions.');
        }

        return this._values[declaration.name];
    }

    /**
     * Gets the set compiler options.
     */
    getCompilerOptions(): ts.CompilerOptions {
        return _.cloneDeep(this._compilerOptions);
    }

    /**
     * Sets the given declared option. Throws if setting the option fails.
     * @param name
     * @param value
     */
    setValue<K extends keyof TypeDocAndTSOptions>(name: K, value: TypeDocAndTSOptions[K]): void;
    setValue(name: NeverIfInternal<string>, value: NeverIfInternal<unknown>): void;
    setValue(name: string, value: unknown): void {
        const declaration = this.getDeclaration(name);
        if (!declaration) {
            throw new Error(`Tried to set an option (${name}) that was not declared.`);
        }

        const converted = convert(value, declaration);
        const bag = declaration.scope === ParameterScope.TypeScript
            ? this._compilerOptions
            : this._values;
        bag[declaration.name] = converted;
    }

    /**
     * Sets all the given option values, throws if any value fails to be set.
     * @param obj
     * @deprecated will be removed in 0.19. Use setValue in a loop instead.
     */
    setValues(obj: NeverIfInternal<Partial<TypeDocAndTSOptions>>): void {
        this._logger.warn('Options.setValues is deprecated and will be removed in 0.19.');
        for (const [name, value] of Object.entries(obj)) {
            this.setValue(name as keyof TypeDocOptions, value);
        }
    }

    /**
     * Sets the value of a given option to its default value.
     * @param declaration The option whose value should be reset.
     */
    private setOptionValueToDefault(declaration: Readonly<DeclarationOption>): void {
        if (declaration.scope !== ParameterScope.TypeScript) {
            // No need to convert the defaultValue for a map type as it has to be of a specific type
            if (declaration.type === ParameterType.Map) {
                this._values[declaration.name] = declaration.defaultValue;
            } else if (declaration.type === ParameterType.Number) {
                // Don't use convert for number options to allow every possible number as a default value
                this._values[declaration.name] = declaration.defaultValue || 0;
            } else {
                this._values[declaration.name] = convert(declaration.defaultValue, declaration);
            }
        }
    }
}

/**
 * Binds an option to the given property. Does not register the option.
 *
 * @since v0.16.3
 */
export function BindOption<K extends keyof TypeDocOptionMap>(name: K):
    <IK extends PropertyKey>(
        target: ({ application: Application } | { options: Options }) & { [K2 in IK]: TypeDocOptions[K] },
        key: IK
    ) => void;

/**
 * Binds an option to the given property. Does not register the option.
 * @since v0.16.3
 *
 * @privateRemarks
 * This overload is intended for plugin use only with looser type checks. Do not use internally.
 */
export function BindOption(name: NeverIfInternal<string>):
    (target: { application: Application } | { options: Options }, key: PropertyKey) => void;

export function BindOption(name: string) {
    return function(target: { application: Application } | { options: Options }, key: PropertyKey) {
        Object.defineProperty(target, key, {
            get(this: { application: Application } | { options: Options }) {
                if ('options' in this) {
                    return this.options.getValue(name as keyof TypeDocOptions);
                } else {
                    return this.application.options.getValue(name as keyof TypeDocOptions);
                }
            },
            enumerable: true,
            configurable: true
        });
    };
}
