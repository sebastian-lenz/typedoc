import * as fs from 'fs/promises';
import * as path from 'path';
import * as ts from 'typescript';
import { Converter } from './converter/converter';
import { ProjectReflection } from './models/index';
import { Serializer } from './serialization';
import { CallbackLogger, ConsoleLogger, expandDirectories, loadPlugins, Logger, Options, TypeDocAndTSOptions, TypeDocOptions } from './utils';
import { Renderer } from './renderer';

import { load as loadSources } from './plugins/sources';
import { load as loadSort } from './plugins/sort';

export class Application {
    /**
     * The converter used to create the declaration reflections.
     */
    readonly converter = new Converter(this);

    /**
     * The serializer used to generate JSON output.
     */
    readonly serializer = new Serializer();

    /**
     * Component used to render reflections into output that is human readable.
     */
    readonly renderer = new Renderer(this);

    /**
     * The logger that should be used to output messages.
     */
    logger: Logger = new ConsoleLogger();

    /**
     * Container describing all TypeDoc + TS options.
     */
    readonly options = new Options(this.logger);

    /**
     * Create a new TypeDoc application instance.
     *
     * @param options An object containing the options that should be used.
     */
    constructor() {
        this.options.addDefaultDeclarations();
    }

    /**
     * Initialize TypeDoc with the given options object.
     *
     * @param options  The desired options to set.
     */
    bootstrap(options: Partial<TypeDocAndTSOptions> = {}): void {
        for (const [key, val] of Object.entries(options)) {
            try {
                this.options.setValue(key as keyof TypeDocOptions, val);
            } catch {
                // Ignore errors, plugins haven't been loaded yet and may declare an option.
            }
        }
        this.options.read(new Logger());

        const logger = this.options.getValue('logger');
        if (typeof logger === 'function') {
            this.logger = new CallbackLogger(logger);
            this.options.setLogger(this.logger);
        } else if (logger === 'none') {
            this.logger = new Logger();
            this.options.setLogger(this.logger);
        }
        this.logger.level = this.options.getValue('logLevel');

        loadSources(this);
        loadSort(this);
        loadPlugins(this, this.options.getValue('plugin'), this.logger);

        this.options.reset();
        for (const [key, val] of Object.entries(options)) {
            try {
                this.options.setValue(key as keyof TypeDocOptions, val);
            } catch (error) {
                this.logger.error(error.message);
            }
        }
        this.options.read(this.logger);
    }

    /**
     * Run the converter for the given set of files and return the generated reflections.
     *
     * @param src  A list of source that should be compiled and converted.
     * @returns An instance of ProjectReflection on success, undefined otherwise.
     */
    async convert(): Promise<ProjectReflection | undefined> {
        const inputFiles = await expandDirectories(
            this.options.getValue('inputFiles'),
            this.options.getValue('exclude'),
            !!this.options.getCompilerOptions().allowJs,
            this.options.getValue('includeDeclarations'));

        const start = Date.now();
        const program = ts.createProgram(inputFiles, this.options.getCompilerOptions());

        const beforeErrors = Date.now();
        this.logger.verbose(`[Perf] Creating program took ${beforeErrors - start}ms`);

        const errors = [
            ...program.getOptionsDiagnostics(),
            ...program.getSyntacticDiagnostics(),
            ...program.getGlobalDiagnostics(),
            ...program.getSemanticDiagnostics()
        ];

        this.logger.verbose(`[Perf] Checking errors took ${Date.now() - beforeErrors}ms`);

        if (errors.length) {
            this.logger.diagnostics(errors);
            return;
        }

        return this.converter.convert(program, inputFiles);
    }

    /**
     * Emit rendered documentation for the given project.
     * @param out the directory to write the rendered documentation to.
     */
    async generateDocs(project: ProjectReflection, out: string): Promise<void> {
        out = path.resolve(out);
        await this.renderer.render(project, out);
        this.logger.success('Documentation generated at %s', out);
    }

    /**
     * Run the converter for the given set of files and write the reflections to a json file.
     *
     * @param out The path and file name to write the serialized project to.
     */
    async generateJson(project: ProjectReflection, out: string): Promise<void> {
        const serialized = this.serializer.toObject(project);
        await fs.writeFile(out, JSON.stringify(serialized, null, '\t'));
        this.logger.success('JSON written to %s', out);
    }
}
