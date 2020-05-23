/**
 * The TypeDoc main module and namespace.
 *
 * The [[Application]] class holds the core logic of the cli application. All code related
 * to resolving reflections is stored in [[TypeDoc.Factories]], the actual data models can be found
 * in [[TypeDoc.Models]] and the final rendering is defined in [[TypeDoc.Output]].
 */

import * as Path from 'path';
import * as FS from 'fs';
import * as typescript from 'typescript';

import { Converter } from './converter/index';
import { Renderer } from './output/renderer';
import { Serializer } from './serialization';
import { ProjectReflection } from './models/index';
import { Logger, ConsoleLogger, CallbackLogger, PluginHost, writeFile, readFile } from './utils/index';
import { createMinimatch } from './utils/paths';

import {
    AbstractComponent,
    ChildableComponent,
    Component,
    DUMMY_APPLICATION_OWNER
} from './utils/component';
import { Options, BindOption } from './utils';
import { TypeDocAndTSOptions, TypeDocOptions } from './utils/options/declaration';

/**
 * The default TypeDoc main application class.
 *
 * This class holds the two main components of TypeDoc, the [[Dispatcher]] and
 * the [[Renderer]]. When running TypeDoc, first the [[Dispatcher]] is invoked which
 * generates a [[ProjectReflection]] from the passed in source files. The
 * [[ProjectReflection]] is a hierarchical model representation of the TypeScript
 * project. Afterwards the model is passed to the [[Renderer]] which uses an instance
 * of [[BaseTheme]] to generate the final documentation.
 *
 * Both the [[Dispatcher]] and the [[Renderer]] are subclasses of the [[EventDispatcher]]
 * and emit a series of events while processing the project. Subscribe to these Events
 * to control the application flow or alter the output.
 */
@Component({ name: 'application', internal: true })
export class Application extends ChildableComponent<
    Application,
    AbstractComponent<Application>
> {
    /**
     * The converter used to create the declaration reflections.
     */
    converter: Converter;

    /**
     * The renderer used to generate the documentation output.
     */
    renderer: Renderer;

    /**
     * The serializer used to generate JSON output.
     */
    serializer: Serializer;

    /**
     * The logger that should be used to output messages.
     */
    logger: Logger;

    options: Options;

    plugins: PluginHost;

    @BindOption('logger')
    loggerType!: string | Function;

    @BindOption('ignoreCompilerErrors')
    ignoreCompilerErrors!: boolean;

    @BindOption('exclude')
    exclude!: Array<string>;

    @BindOption('inputFiles')
    inputFiles!: string[];

    @BindOption('options')
    optionsFile!: string;

    @BindOption('tsconfig')
    project!: string;

    /**
     * The version number of TypeDoc.
     */
    static VERSION = '{{ VERSION }}';

    /**
     * Create a new TypeDoc application instance.
     *
     * @param options An object containing the options that should be used.
     */
    constructor() {
        super(DUMMY_APPLICATION_OWNER);

        this.logger = new ConsoleLogger();
        this.options = new Options(this.logger);
        this.options.addDefaultDeclarations();
        this.serializer = new Serializer();
        this.converter = this.addComponent<Converter>('converter', Converter);
        this.renderer  = this.addComponent<Renderer>('renderer', Renderer);
        this.plugins   = this.addComponent('plugins', PluginHost);
    }

    /**
     * Initialize TypeDoc with the given options object.
     *
     * @param options  The desired options to set.
     */
    bootstrap(options: Partial<TypeDocAndTSOptions> = {}): { hasErrors: boolean, inputFiles: string[] } {
        for (const [key, val] of Object.entries(options)) {
            try {
                this.options.setValue(key as keyof TypeDocOptions, val);
            } catch {
                // Ignore errors, plugins haven't been loaded yet and may declare an option.
            }
        }
        this.options.read(new Logger());

        const logger = this.loggerType;
        if (typeof logger === 'function') {
            this.logger = new CallbackLogger(<any> logger);
            this.options.setLogger(this.logger);
        } else if (logger === 'none') {
            this.logger = new Logger();
            this.options.setLogger(this.logger);
        }

        this.plugins.load();

        this.options.reset();
        for (const [key, val] of Object.entries(options)) {
            try {
                this.options.setValue(key as keyof TypeDocOptions, val);
            } catch (error) {
                this.logger.error(error.message);
            }
        }
        this.options.read(this.logger);

        return {
            hasErrors: this.logger.hasErrors(),
            inputFiles: this.inputFiles
        };
    }

    /**
     * Return the application / root component instance.
     */
    get application(): Application {
        return this;
    }

    /**
     * Return the path to the TypeScript compiler.
     */
    public getTypeScriptPath(): string {
        return Path.dirname(require.resolve('typescript'));
    }

    public getTypeScriptVersion(): string {
        const tsPath = this.getTypeScriptPath();
        const json = JSON.parse(readFile(Path.join(tsPath, '..', 'package.json')));
        return json.version;
    }

    /**
     * Run the converter for the given set of files and return the generated reflections.
     *
     * @param src  A list of source that should be compiled and converted.
     * @returns An instance of ProjectReflection on success, undefined otherwise.
     */
    public convert(src: string[]): ProjectReflection | undefined {
        this.logger.writeln(
            'Using TypeScript %s from %s',
            this.getTypeScriptVersion(),
            this.getTypeScriptPath()
        );

        const result = this.converter.convert(src);
        if (result.errors && result.errors.length) {
            this.logger.diagnostics(result.errors);
            if (this.ignoreCompilerErrors) {
                this.logger.resetErrors();
                return result.project;
            } else {
                return;
            }
        } else {
            return result.project;
        }
    }

    /**
     * @param src  A list of source files whose documentation should be generated.
     */
    public generateDocs(src: string[], out: string): boolean;

    /**
     * @param project  The project the documentation should be generated for.
     */
    public generateDocs(project: ProjectReflection, out: string): boolean;

    /**
     * Run the documentation generator for the given set of files.
     *
     * @param out  The path the documentation should be written to.
     * @returns TRUE if the documentation could be generated successfully, otherwise FALSE.
     */
    public generateDocs(input: ProjectReflection | string[], out: string): boolean {
        const project = input instanceof ProjectReflection ? input : this.convert(input);
        if (!project) {
            return false;
        }

        out = Path.resolve(out);
        this.renderer.render(project, out);
        if (this.logger.hasErrors()) {
            this.logger.error('Documentation could not be generated due to the errors above.');
        } else {
            this.logger.success('Documentation generated at %s', out);
        }

        return true;
    }

    /**
     * @param src  A list of source that should be compiled and converted.
     */
    public generateJson(src: string[], out: string): boolean;

    /**
     * @param project  The project that should be converted.
     */
    public generateJson(project: ProjectReflection, out: string): boolean;

    /**
     * Run the converter for the given set of files and write the reflections to a json file.
     *
     * @param out  The path and file name of the target file.
     * @returns TRUE if the json file could be written successfully, otherwise FALSE.
     */
    public generateJson(input: ProjectReflection | string[], out: string): boolean {
        const project = input instanceof ProjectReflection ? input : this.convert(input);
        if (!project) {
            return false;
        }

        out = Path.resolve(out);
        const eventData = { outputDirectory: Path.dirname(out), outputFile: Path.basename(out) };
        const ser = this.serializer.toObject(project, { begin: eventData, end: eventData });
        writeFile(out, JSON.stringify(ser, null, '\t'), false);
        this.logger.success('JSON written to %s', out);

        return true;
    }

    /**
     * Expand a list of input files.
     *
     * Searches for directories in the input files list and replaces them with a
     * listing of all TypeScript files within them. One may use the ```--exclude``` option
     * to filter out files with a pattern.
     *
     * @param inputFiles  The list of files that should be expanded.
     * @returns  The list of input files with expanded directories.
     */
    public expandInputFiles(inputFiles: string[] = []): string[] {
        const files: string[] = [];

        const exclude = this.exclude ? createMinimatch(this.exclude) : [];

        function isExcluded(fileName: string): boolean {
            return exclude.some(mm => mm.match(fileName));
        }

        const supportedFileRegex = this.options.getCompilerOptions().allowJs ? /\.[tj]sx?$/ : /\.tsx?$/;
        function add(file: string, entryPoint: boolean) {
            let stats: FS.Stats;
            try {
                stats = FS.statSync(file);
            } catch {
                // No permission or a symbolic link, do not resolve.
                return;
            }
            const fileIsDir = stats.isDirectory();
            if (fileIsDir && !file.endsWith('/')) {
                file = `${file}/`;
            }

            if ((!fileIsDir || !entryPoint) && isExcluded(file.replace(/\\/g, '/'))) {
                return;
            }

            if (fileIsDir) {
                FS.readdirSync(file).forEach(next => {
                    add(Path.join(file, next), false);
                });
            } else if (supportedFileRegex.test(file)) {
                files.push(file);
            }
        }

        inputFiles.forEach(file => {
            add(Path.resolve(file), true);
        });

        return files;
    }

    /**
     * Print the version number.
     */
    toString() {
        return [
            '',
            `TypeDoc ${Application.VERSION}`,
            `Using TypeScript ${this.getTypeScriptVersion()} from ${this.getTypeScriptPath()}`,
            ''
        ].join(typescript.sys.newLine);
    }
}
