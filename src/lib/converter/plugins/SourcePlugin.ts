import * as Path from 'path';
import * as ts from 'typescript';
import * as _ts from '../../ts-internal';

import { Reflection, ProjectReflection, DeclarationReflection } from '../../models/reflections/index';
import { SourceDirectory, SourceFile } from '../../models/sources/index';
import { Component, ConverterComponent } from '../components';
import { BasePath } from '../utils/base-path';
import { Converter } from '../converter';
import { Context } from '../context';
import { BindOption } from '../../utils';

declare module '../../models/reflections/abstract' {
    export interface Reflection {
        /**
         * A list of all source files that contributed to this reflection.
         * This is added by the {@link SourcePlugin}.
         */
        sources?: SourceReference[];
    }
}

declare module '../../models/reflections/project' {
    export interface ProjectReflection {
        /**
         * A list of all source files within the project.
         */
        files: SourceFile[];

        /**
         * The root directory of the project.
         */
        directory: SourceDirectory;
    }
}

/**
 * A handler that attaches source file information to reflections.
 */
@Component({name: 'source'})
export class SourcePlugin extends ConverterComponent {
    @BindOption('disableSources')
    readonly disableSources!: boolean;

    /**
     * Helper for resolving the base path of all source files.
     */
    private basePath = new BasePath();

    /**
     * A map of all generated [[SourceFile]] instances.
     */
    private fileMappings: {[name: string]: SourceFile} = {};

    /**
     * Create a new SourceHandler instance.
     */
    initialize() {
        // this.listenTo(this.owner, {
        //     [Converter.EVENT_BEGIN]:              this.onBegin,
        //     [Converter.EVENT_FILE_BEGIN]:         this.onBeginDocument,
        //     [Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
        //     [Converter.EVENT_CREATE_SIGNATURE]:   this.onDeclaration,
        //     [Converter.EVENT_RESOLVE_BEGIN]:      this.onBeginResolve,
        //     [Converter.EVENT_RESOLVE]:            this.onResolve,
        //     [Converter.EVENT_RESOLVE_END]:        this.onEndResolve
        // });
    }

    private getSourceFile(fileName: string, project: ProjectReflection): SourceFile {
        if (!this.fileMappings[fileName]) {
            const file = new SourceFile(fileName);
            this.fileMappings[fileName] = file;
            project.files.push(file);
        }

        return this.fileMappings[fileName];
    }

    /**
     * Triggered once per project before the dispatcher invokes the compiler.
     *
     * @param event  An event object containing the related project and compiler instance.
     */
    private onBegin() {
        this.basePath.reset();
        this.fileMappings = {};
    }

    /**
     * Triggered when the converter begins converting a source file.
     *
     * Create a new [[SourceFile]] instance for all TypeScript files.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently processed.
     * @param node  The node that is currently processed if available.
     */
    private onBeginDocument(context: Context, reflection: Reflection, node?: ts.SourceFile) {
        if (!node) {
            return;
        }
        const fileName = node.fileName;
        this.basePath.add(fileName);
        this.getSourceFile(fileName, context.project);
    }

    /**
     * Triggered when the converter has created a declaration reflection.
     *
     * Attach the current source file to the [[DeclarationReflection.sources]] array.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently processed.
     * @param node  The node that is currently processed if available.
     */
    private onDeclaration(context: Context, reflection: Reflection, node?: ts.Node) {
        if (!node || this.disableSources) {
            return;
        }
        const sourceFile = node.getSourceFile();
        const fileName = sourceFile.fileName;
        this.basePath.add(fileName);
        const file: SourceFile = this.getSourceFile(fileName, context.project);

        let position: ts.LineAndCharacter;
        if (node['name'] && node['name'].end) {
            position = ts.getLineAndCharacterOfPosition(sourceFile, node['name'].end);
        } else {
            position = ts.getLineAndCharacterOfPosition(sourceFile, node.pos);
        }

        if (reflection instanceof DeclarationReflection) {
            file.reflections.push(reflection);
        }

        if (!reflection.sources) {
            reflection.sources = [];
        }

        reflection.sources.push({
            file: file,
            fileName: fileName,
            line: position.line + 1,
            character: position.character
        });
    }

    /**
     * Triggered when the converter begins resolving a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onBeginResolve(context: Context) {
        context.project.files.forEach((file) => {
            const fileName = file.fileName = this.basePath.trim(file.fileName);
            this.fileMappings[fileName] = file;
        });
    }

    /**
     * Triggered when the converter resolves a reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently resolved.
     */
    private onResolve(context: Context, reflection: Reflection) {
        if (!reflection.sources) {
            return;
        }
        reflection.sources.forEach((source) => {
            source.fileName = this.basePath.trim(source.fileName);
        });
    }

    /**
     * Triggered when the converter has finished resolving a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onEndResolve(context: Context) {
        const project = context.project;
        const home = project.directory;
        project.files.forEach((file) => {
            const reflections: Reflection[] = [];
            file.reflections.forEach((reflection) => {
                reflections.push(reflection);
            });

            let directory = home;
            const path = Path.dirname(file.fileName);
            if (path !== '.') {
                path.split('/').forEach((pathPiece) => {
                    if (!Object.prototype.hasOwnProperty.call(directory.directories, pathPiece)) {
                        directory.directories[pathPiece] = new SourceDirectory(pathPiece, directory);
                    }
                    directory = directory.directories[pathPiece];
                });
            }

            directory.files.push(file);
            // reflections.sort(GroupHandler.sortCallback);
            file.parent = directory;
            file.reflections = reflections;
        });
    }
}
