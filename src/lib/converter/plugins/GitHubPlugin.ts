import * as Path from "path";
import { spawnSync } from "child_process";

import type { SourceReference } from "../../models/sources/file";
import { Component, ConverterComponent } from "../components";
import { BasePath } from "../utils/base-path";
import { Converter } from "../converter";
import type { Context } from "../context";
import { BindOption } from "../../utils";

function git(...args: string[]) {
    return spawnSync("git", args, { encoding: "utf-8", windowsHide: true });
}

/**
 * Stores data of a repository.
 */
export class Repository {
    /**
     * The root path of this repository.
     */
    path: string;

    /**
     * The name of the branch this repository is on right now.
     */
    branch: string;

    /**
     * A list of all files tracked by the repository.
     */
    files: string[] = [];

    /**
     * The user/organization name of this repository on GitHub.
     */
    gitHubUser?: string;

    /**
     * The project name of this repository on GitHub.
     */
    gitHubProject?: string;

    /**
     * The hostname for this github project.
     *
     * Defaults to: `github.com` (for normal, public GitHub instance projects)
     *
     * Or the hostname for an enterprise version of GitHub, e.g. `github.acme.com`
     * (if found as a match in the list of git remotes).
     */
    gitHubHostname = "github.com";

    /**
     * Create a new Repository instance.
     *
     * @param path  The root path of the repository.
     */
    constructor(path: string, gitRevision: string, repoLinks: string[]) {
        this.path = path;
        this.branch = gitRevision || "master";

        for (let i = 0, c = repoLinks.length; i < c; i++) {
            const url = /(github(?:\.[a-z]+)*\.com)[:/]([^/]+)\/(.*)/.exec(
                repoLinks[i]
            );

            if (url) {
                this.gitHubHostname = url[1];
                this.gitHubUser = url[2];
                this.gitHubProject = url[3];
                if (this.gitHubProject.substr(-4) === ".git") {
                    this.gitHubProject = this.gitHubProject.substr(
                        0,
                        this.gitHubProject.length - 4
                    );
                }
                break;
            }
        }

        let out = git("-C", path, "ls-files");
        if (out.status === 0) {
            out.stdout.split("\n").forEach((file) => {
                if (file !== "") {
                    this.files.push(BasePath.normalize(path + "/" + file));
                }
            });
        }

        if (!gitRevision) {
            out = git("-C", path, "rev-parse", "--short", "HEAD");
            if (out.status === 0) {
                this.branch = out.stdout.replace("\n", "");
            }
        }
    }

    /**
     * Check whether the given file is tracked by this repository.
     *
     * @param fileName  The name of the file to test for.
     * @returns TRUE when the file is part of the repository, otherwise FALSE.
     */
    contains(fileName: string): boolean {
        return this.files.includes(fileName);
    }

    /**
     * Get the URL of the given file on GitHub.
     *
     * @param fileName  The file whose GitHub URL should be determined.
     * @returns An url pointing to the web preview of the given file or NULL.
     */
    getGitHubURL(fileName: string): string | undefined {
        if (
            !this.gitHubUser ||
            !this.gitHubProject ||
            !this.contains(fileName)
        ) {
            return;
        }

        return [
            `https://${this.gitHubHostname}`,
            this.gitHubUser,
            this.gitHubProject,
            "blob",
            this.branch,
            fileName.substr(this.path.length + 1),
        ].join("/");
    }

    /**
     * Try to create a new repository instance.
     *
     * Checks whether the given path is the root of a valid repository and if so
     * creates a new instance of [[Repository]].
     *
     * @param path  The potential repository root.
     * @returns A new instance of [[Repository]] or undefined.
     */
    static tryCreateRepository(
        path: string,
        gitRevision: string,
        gitRemote: string
    ): Repository | undefined {
        const out = git("-C", path, "rev-parse", "--show-toplevel");
        const remotesOutput = git("-C", path, "remote", "get-url", gitRemote);

        if (out.status !== 0 || remotesOutput.status !== 0) {
            return;
        }

        return new Repository(
            BasePath.normalize(out.stdout.replace("\n", "")),
            gitRevision,
            remotesOutput.stdout.split("\n")
        );
    }
}

/**
 * A handler that watches for repositories with GitHub origin and links
 * their source files to the related GitHub pages.
 */
@Component({ name: "git-hub" })
export class GitHubPlugin extends ConverterComponent {
    /**
     * List of known repositories.
     */
    private repositories: { [path: string]: Repository } = {};

    /**
     * List of paths known to be not under git control.
     */
    private ignoredPaths: string[] = [];

    @BindOption("gitRevision")
    readonly gitRevision!: string;

    @BindOption("gitRemote")
    readonly gitRemote!: string;

    /**
     * Create a new GitHubHandler instance.
     *
     * @param converter  The converter this plugin should be attached to.
     */
    initialize() {
        if (git("--version").status === 0) {
            this.listenTo(
                this.owner,
                Converter.EVENT_RESOLVE_END,
                this.onEndResolve
            );
        }
    }

    /**
     * Check whether the given file is placed inside a repository.
     *
     * @param fileName  The name of the file a repository should be looked for.
     * @returns The found repository info or undefined.
     */
    private getRepository(fileName: string): Repository | undefined {
        // Check for known non-repositories
        const dirName = Path.dirname(fileName);
        for (let i = 0, c = this.ignoredPaths.length; i < c; i++) {
            if (this.ignoredPaths[i] === dirName) {
                return;
            }
        }

        // Check for known repositories
        for (const path of Object.keys(this.repositories)) {
            if (fileName.substr(0, path.length).toLowerCase() === path) {
                return this.repositories[path];
            }
        }

        // Try to create a new repository
        const repository = Repository.tryCreateRepository(
            dirName,
            this.gitRevision,
            this.gitRemote
        );
        if (repository) {
            this.repositories[repository.path.toLowerCase()] = repository;
            return repository;
        }

        // No repository found, add path to ignored paths
        const segments = dirName.split("/");
        for (let i = segments.length; i > 0; i--) {
            this.ignoredPaths.push(segments.slice(0, i).join("/"));
        }
    }

    /**
     * Triggered when the converter has finished resolving a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onEndResolve(context: Context) {
        const project = context.project;
        project.files.forEach((sourceFile) => {
            const repository = this.getRepository(sourceFile.fullFileName);
            if (repository) {
                sourceFile.url = repository.getGitHubURL(
                    sourceFile.fullFileName
                );
            }
        });

        for (const key in project.reflections) {
            const reflection = project.reflections[key];
            if (reflection.sources) {
                reflection.sources.forEach((source: SourceReference) => {
                    if (source.file && source.file.url) {
                        source.url = source.file.url + "#L" + source.line;
                    }
                });
            }
        }
    }
}
