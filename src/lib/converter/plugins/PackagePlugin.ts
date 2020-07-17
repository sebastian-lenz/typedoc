import * as Path from "path";
import * as FS from "fs";
import * as ts from "typescript";

import { Reflection } from "../../models/reflections/abstract";
import { Component, ConverterComponent } from "../components";
import { Converter } from "../converter";
import { Context } from "../context";
import { BindOption, readFile } from "../../utils";

/**
 * A handler that tries to find the package.json and readme.md files of the
 * current project.
 *
 * The handler traverses the file tree upwards for each file processed by the processor
 * and records the nearest package info files it can find. Within the resolve files, the
 * contents of the found files will be read and appended to the ProjectReflection.
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
   * List of directories the handler already inspected.
   */
  private visited!: string[];

  /**
   * Should the readme file be ignored?
   */
  private noReadmeFile?: boolean;

  /**
   * Create a new PackageHandler instance.
   */
  initialize() {
    // this.listenTo(this.owner, {
    //     [Converter.EVENT_BEGIN]:         this.onBegin,
    //     [Converter.EVENT_FILE_BEGIN]:    this.onBeginDocument,
    //     [Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve
    // });
  }

  /**
   * Triggered when the converter begins converting a project.
   *
   * @param context  The context object describing the current state the converter is in.
   */
  private onBegin(context: Context) {
    this.readmeFile = undefined;
    this.packageFile = undefined;
    this.visited = [];

    let readme = this.readme;
    this.noReadmeFile = readme === "none";
    if (!this.noReadmeFile && readme) {
      readme = Path.resolve(readme);
      if (FS.existsSync(readme)) {
        this.readmeFile = readme;
      }
    }
  }

  /**
   * Triggered when the converter begins converting a source file.
   *
   * @param context  The context object describing the current state the converter is in.
   * @param reflection  The reflection that is currently processed.
   * @param node  The node that is currently processed if available.
   */
  private onBeginDocument(
    context: Context,
    reflection: Reflection,
    node?: ts.SourceFile
  ) {
    const packageAndReadmeFound = () =>
      (this.noReadmeFile || this.readmeFile) && this.packageFile;
    const reachedTopDirectory = (dirName) =>
      dirName === Path.resolve(Path.join(dirName, ".."));
    const visitedDirBefore = (dirName) => this.visited.includes(dirName);

    if (!node) {
      return;
    }

    const fileName = node.fileName;
    let dirName = Path.resolve(Path.dirname(fileName));
    while (
      !packageAndReadmeFound() &&
      !reachedTopDirectory(dirName) &&
      !visitedDirBefore(dirName)
    ) {
      FS.readdirSync(dirName).forEach((file) => {
        const lowercaseFileName = file.toLowerCase();
        if (
          !this.noReadmeFile &&
          !this.readmeFile &&
          lowercaseFileName === "readme.md"
        ) {
          this.readmeFile = Path.join(dirName, file);
        }

        if (!this.packageFile && lowercaseFileName === "package.json") {
          this.packageFile = Path.join(dirName, file);
        }
      });

      this.visited.push(dirName);
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
