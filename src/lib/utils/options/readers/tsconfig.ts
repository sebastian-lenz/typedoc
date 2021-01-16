import { resolve, basename } from "path";
import { existsSync, statSync } from "fs";

import * as ts from "typescript";

import { OptionsReader, Options } from "../options";
import { Logger } from "../../loggers";
import { normalizePath } from "../../fs";

function isFile(file: string) {
    return existsSync(file) && statSync(file).isFile();
}

export class TSConfigReader implements OptionsReader {
    /**
     * Note: Runs after the [[TypeDocReader]].
     */
    priority = 200;

    name = "tsconfig-json";

    read(container: Options, logger: Logger): void {
        const file = container.getValue("tsconfig");

        let fileToRead: string | undefined = file;
        if (!isFile(fileToRead)) {
            fileToRead = ts.findConfigFile(
                file,
                isFile,
                file.toLowerCase().endsWith(".json")
                    ? basename(file)
                    : undefined
            );
        }

        if (!fileToRead || !isFile(fileToRead)) {
            // If the user didn't give us this option, we shouldn't complain about not being able to find it.
            if (container.isSet("tsconfig")) {
                logger.error(`The tsconfig file ${file} does not exist`);
            }
            return;
        }

        fileToRead = normalizePath(resolve(fileToRead));

        let fatalError = false as boolean;
        const parsed = ts.getParsedCommandLineOfConfigFile(
            fileToRead,
            {},
            {
                ...ts.sys,
                onUnRecoverableConfigFileDiagnostic(error) {
                    logger.diagnostic(error);
                    fatalError = true;
                },
            }
        );

        if (!parsed || fatalError) {
            return;
        }

        logger.diagnostics(parsed.errors);

        const typedocOptions = parsed.raw?.typedocOptions ?? {};
        if (typedocOptions.options) {
            logger.error(
                [
                    "typedocOptions in tsconfig file specifies an option file to read but the option",
                    "file has already been read. This is likely a misconfiguration.",
                ].join(" ")
            );
            delete typedocOptions.options;
        }
        if (typedocOptions.tsconfig) {
            logger.error(
                "typedocOptions in tsconfig file may not specify a tsconfig file to read"
            );
            delete typedocOptions.tsconfig;
        }

        container.setCompilerOptions(
            parsed.fileNames,
            parsed.options,
            parsed.projectReferences
        );
        for (const [key, val] of Object.entries(typedocOptions || {})) {
            try {
                // We catch the error, so can ignore the strict type checks
                container.setValue(key as never, val as never);
            } catch (error) {
                logger.error(error.message);
            }
        }
    }
}
