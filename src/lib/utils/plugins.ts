import * as FS from "fs";
import * as Path from "path";

import type { Application } from "../application";
import { readFile } from "./fs";
import type { Logger } from "./loggers";

export function loadPlugins(app: Application, plugins: readonly string[]) {
    for (const plugin of resolvePluginPaths(plugins)) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const instance = require(plugin);
            let initFunction = instance.load;

            if (
                typeof initFunction !== "function" &&
                typeof instance === "function"
            ) {
                app.logger.deprecated(
                    `${plugin} uses a deprecated structure. Plugins should export a "load" function to be called with the Application`
                );
                initFunction = instance;
            }

            if (typeof initFunction === "function") {
                initFunction(app);
                app.logger.info(`Loaded plugin ${plugin}`);
            } else {
                app.logger.error(
                    `Invalid structure in plugin ${plugin}, no load function found.`
                );
            }
        } catch (error) {
            app.logger.error(`The plugin ${plugin} could not be loaded.`);
            app.logger.error(error.stack);
        }
    }
}

export function discoverNpmPlugins(app: Application): string[] {
    const result: string[] = [];
    discover();
    return result;

    /**
     * Find all parent folders containing a `node_modules` subdirectory.
     */
    function discover() {
        let path = process.cwd();
        let previous: string;

        do {
            const modules = Path.join(path, "node_modules");
            if (FS.existsSync(modules) && FS.statSync(modules).isDirectory()) {
                discoverModules(modules);
            }

            previous = path;
            path = Path.resolve(Path.join(previous, ".."));
        } while (previous !== path);
    }

    /**
     * Scan the given `node_modules` directory for TypeDoc plugins.
     */
    function discoverModules(basePath: string) {
        const candidates: string[] = [];
        FS.readdirSync(basePath).forEach((name) => {
            const dir = Path.join(basePath, name);
            if (name.startsWith("@") && FS.statSync(dir).isDirectory()) {
                FS.readdirSync(dir).forEach((n) => {
                    candidates.push(Path.join(name, n));
                });
            }
            candidates.push(name);
        });
        candidates.forEach((name) => {
            const infoFile = Path.join(basePath, name, "package.json");
            if (!FS.existsSync(infoFile)) {
                return;
            }

            const info = loadPackageInfo(app.logger, infoFile);
            if (isPlugin(info)) {
                result.push(Path.join(basePath, name));
            }
        });
    }
}

/**
 * Load and parse the given `package.json`.
 */
function loadPackageInfo(logger: Logger, fileName: string): any {
    try {
        return JSON.parse(readFile(fileName));
    } catch (error) {
        logger.error(`Could not parse ${fileName}`);
        return {};
    }
}

/**
 * Test whether the given package info describes a TypeDoc plugin.
 */
function isPlugin(info: any): boolean {
    if (typeof info !== "object" || !info) {
        return false;
    }

    const keywords: unknown[] = info.keywords;
    if (!keywords || !Array.isArray(keywords)) {
        return false;
    }

    return keywords.some(
        (keyword) =>
            typeof keyword === "string" &&
            keyword.toLocaleLowerCase() === "typedocplugin"
    );
}

function resolvePluginPaths(plugins: readonly string[]) {
    const cwd = process.cwd();
    return plugins.map((plugin) => {
        // treat plugins that start with `.` as relative, requiring resolution
        if (plugin.startsWith(".")) {
            return Path.resolve(cwd, plugin);
        }
        return plugin;
    });
}
