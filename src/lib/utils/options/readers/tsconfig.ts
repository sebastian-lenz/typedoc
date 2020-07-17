import { resolve, dirname, basename } from "path";
import { existsSync, statSync } from "fs";

import * as ts from "typescript";

import { OptionsReader, Options } from "../options";
import { Logger } from "../../loggers";
import { IGNORED } from "../sources/typescript";

function isFile(file: string) {
  return existsSync(file) && statSync(file).isFile();
}

export class TSConfigReader implements OptionsReader {
  /**
   * Note: Runs after the [[TypeDocReader]].
   */
  order = 200;

  name = "tsconfig-json";

  read(container: Options, logger: Logger): void {
    const tsconfigOpt = container.getValue("tsconfig");
    const projectOpt = container.getCompilerOptions().project;

    if (!container.isDefault("tsconfig")) {
      this._tryReadOptions(tsconfigOpt, container, logger);
      return;
    }

    if (projectOpt) {
      this._tryReadOptions(projectOpt, container, logger);
      return;
    }

    // Don't log errors if we try to read by default.
    this._tryReadOptions(tsconfigOpt, container);
  }

  private _tryReadOptions(
    file: string,
    container: Options & { setValue(name: string, value: unknown): void },
    logger?: Logger
  ): void {
    let fileToRead: string | undefined = file;
    if (!isFile(fileToRead)) {
      fileToRead = ts.findConfigFile(
        file,
        isFile,
        file.toLowerCase().endsWith(".json") ? basename(file) : undefined
      );
    }

    if (!fileToRead || !isFile(fileToRead)) {
      logger?.error(`The tsconfig file ${file} does not exist`);
      return;
    }

    fileToRead = resolve(fileToRead);

    const { config } = ts.readConfigFile(fileToRead, ts.sys.readFile);
    const {
      fileNames,
      options,
      raw: { typedocOptions = {} },
    } = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      dirname(fileToRead),
      {},
      fileToRead
    );

    container.setValue("inputFiles", fileNames);
    for (const key of IGNORED) {
      delete options[key];
    }

    if (typedocOptions.options) {
      logger?.error(
        [
          "typedocOptions in tsconfig file specifies an option file to read but the option",
          "file has already been read. This is likely a misconfiguration.",
        ].join(" ")
      );
      delete typedocOptions.options;
    }

    for (const [key, val] of Object.entries(options)) {
      try {
        container.setValue(key, val);
      } catch (error) {
        logger?.error(error.message);
      }
    }
    for (const [key, val] of Object.entries(typedocOptions || {})) {
      try {
        container.setValue(key, val);
      } catch (error) {
        logger?.error(error.message);
      }
    }
  }
}
