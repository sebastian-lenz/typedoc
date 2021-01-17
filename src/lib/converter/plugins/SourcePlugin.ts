import * as Path from "path";
import * as ts from "typescript";

import {
    Reflection,
    ProjectReflection,
    DeclarationReflection,
} from "../../models/reflections/index";
import { SourceDirectory, SourceFile } from "../../models/sources/index";
import { Component, ConverterComponent } from "../components";
import { Converter } from "../converter";
import type { Context } from "../context";
import { BindOption } from "../../utils";
import { isNamedNode } from "../utils/nodes";
import { getCommonDirectory, normalizePath } from "../../utils/fs";
import { relative } from "path";
import * as assert from "assert";

/**
 * A handler that attaches source file information to reflections.
 */
@Component({ name: "source" })
export class SourcePlugin extends ConverterComponent {
    @BindOption("disableSources")
    readonly disableSources!: boolean;

    /**
     * A map of all generated [[SourceFile]] instances.
     */
    private fileMappings: { [name: string]: SourceFile } = {};

    /**
     * All file names to find the base path from.
     */
    private fileNames = new Set<string>();
    private basePath?: string;

    /**
     * Create a new SourceHandler instance.
     */
    initialize() {
        this.listenTo(this.owner, {
            [Converter.EVENT_BEGIN]: this.onBegin,
            [Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
            [Converter.EVENT_CREATE_SIGNATURE]: this.onDeclaration,
            [Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
            [Converter.EVENT_RESOLVE]: this.onResolve,
            [Converter.EVENT_RESOLVE_END]: this.onEndResolve,
        });
    }

    private getSourceFile(
        fileName: string,
        project: ProjectReflection
    ): SourceFile {
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
        this.fileNames.clear();
        this.fileMappings = {};
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
    private onDeclaration(
        context: Context,
        reflection: Reflection,
        node?: ts.Node
    ) {
        if (!node || this.disableSources) {
            return;
        }
        const sourceFile = node.getSourceFile();
        const fileName = sourceFile.fileName;
        this.fileNames.add(fileName);
        const file: SourceFile = this.getSourceFile(fileName, context.project);

        let position: ts.LineAndCharacter;
        if (isNamedNode(node)) {
            position = ts.getLineAndCharacterOfPosition(
                sourceFile,
                node.name.end
            );
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
            character: position.character,
        });
    }

    /**
     * Triggered when the converter begins resolving a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onBeginResolve(context: Context) {
        this.basePath = getCommonDirectory([...this.fileNames]);
        for (const file of context.project.files) {
            const fileName = (file.fileName = normalizePath(
                relative(this.basePath, file.fileName)
            ));
            this.fileMappings[fileName] = file;
        }
    }

    /**
     * Triggered when the converter resolves a reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently resolved.
     */
    private onResolve(_context: Context, reflection: Reflection) {
        assert(this.basePath != null);
        for (const source of reflection.sources ?? []) {
            source.fileName = normalizePath(
                relative(this.basePath, source.fileName)
            );
        }
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
            if (path !== ".") {
                path.split("/").forEach((pathPiece) => {
                    if (
                        !Object.prototype.hasOwnProperty.call(
                            directory.directories,
                            pathPiece
                        )
                    ) {
                        directory.directories[pathPiece] = new SourceDirectory(
                            pathPiece,
                            directory
                        );
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
