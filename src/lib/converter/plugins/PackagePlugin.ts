import * as Path from "path";
import * as FS from "fs";

import { Component, ConverterComponent } from "../components";
import { Converter } from "../converter";
import type { Context } from "../context";
import { BindOption, readFile } from "../../utils";
import { getCommonDirectory } from "../../utils/fs";

/**
 * A handler that tries to find the package.json and readme.md files of the
 * current project.
 */
@Component({ name: "package" })
export class PackagePlugin extends ConverterComponent {
    @BindOption("readme")
    readme!: string;

    @BindOption("includeVersion")
    includeVersion!: boolean;

    /**
     * The file name of the found readme.md file.
     */
    private readmeFile?: string;

    /**
     * The file name of the found package.json file.
     */
    private packageFile?: string;

    /**
     * Create a new PackageHandler instance.
     */
    initialize() {
        this.listenTo(this.owner, {
            [Converter.EVENT_BEGIN]: this.onBegin,
            [Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
        });
    }

    /**
     * Triggered when the converter begins converting a project.
     */
    private onBegin(_context: Context) {
        this.readmeFile = undefined;
        this.packageFile = undefined;

        let readme = this.readme;
        const noReadmeFile = readme === "none";
        if (!noReadmeFile && readme) {
            readme = Path.resolve(readme);
            if (FS.existsSync(readme)) {
                this.readmeFile = readme;
            }
        }

        const packageAndReadmeFound = () =>
            (noReadmeFile || this.readmeFile) && this.packageFile;
        const reachedTopDirectory = (dirName: string) =>
            dirName === Path.resolve(Path.join(dirName, ".."));

        let dirName = Path.resolve(
            getCommonDirectory(
                this.application.options
                    .getValue("entryPoints")
                    .map((path) => Path.resolve(path))
            )
        );
        this.application.logger.verbose(`Begin readme search at ${dirName}`);
        while (!packageAndReadmeFound() && !reachedTopDirectory(dirName)) {
            FS.readdirSync(dirName).forEach((file) => {
                const lowercaseFileName = file.toLowerCase();
                if (
                    !noReadmeFile &&
                    !this.readmeFile &&
                    lowercaseFileName === "readme.md"
                ) {
                    this.readmeFile = Path.join(dirName, file);
                }

                if (!this.packageFile && lowercaseFileName === "package.json") {
                    this.packageFile = Path.join(dirName, file);
                }
            });

            dirName = Path.resolve(Path.join(dirName, ".."));
        }
    }

    /**
     * Triggered when the converter begins resolving a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onBeginResolve(context: Context) {
        const project = context.project;
        if (this.readmeFile) {
            project.readme = readFile(this.readmeFile);
        }

        if (this.packageFile) {
            project.packageInfo = JSON.parse(readFile(this.packageFile));
            if (!project.name) {
                project.name = String(project.packageInfo.name);
            }
            if (this.includeVersion) {
                project.name = `${project.name} - v${project.packageInfo.version}`;
            }
        }
    }
}
