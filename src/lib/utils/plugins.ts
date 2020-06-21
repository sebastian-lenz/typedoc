import * as fs from 'fs';
import { join, resolve } from 'path';

import { readFile } from './fs';
import type { Logger } from './loggers';
import { Application } from '../application';

export function loadPlugins(app: Application, plugins: string[], logger: Logger) {
    if (plugins.some(plugin => plugin.toLowerCase() === 'none')) {
        return;
    }

    if (plugins.length === 0) {
        plugins = discoverNpmPlugins(logger);
    } else {
        plugins = resolvePluginPaths(plugins);
    }

    for (const plugin of plugins) {
        loadPlugin(app, plugin, logger);
    }
}

function loadPlugin(app: Application, plugin: string, logger: Logger) {
    try {
        const instance = require(plugin);
        if (typeof instance.load === 'function') {
            instance.load(app);
            logger.write('Loaded plugin %s', plugin);
        } else {
            logger.error('Invalid structure in plugin %s, no load function found.', plugin);
        }
    } catch (error) {
        logger.error('The plugin %s could not be loaded.', plugin);
        logger.verbose(error.stack);
    }
}

function discoverNpmPlugins(logger: Logger) {
    const result: string[] = [];
    discover();
    return result;

    /**
     * Find all parent folders containing a `node_modules` subdirectory.
     */
    function discover() {
        let path = process.cwd(), previous: string;
        do {
            const modules = join(path, 'node_modules');
            if (fs.existsSync(modules) && fs.statSync(modules).isDirectory()) {
                discoverModules(modules);
            }

            previous = path;
            path = resolve(join(previous, '..'));
        } while (previous !== path);
    }

    /**
     * Scan the given `node_modules` directory for TypeDoc plugins.
     */
    function discoverModules(basePath: string) {
        const candidates: string[] = [];
        fs.readdirSync(basePath).forEach((name) => {
            const dir = join(basePath, name);
            if (name.startsWith('@') && fs.statSync(dir).isDirectory()) {
                fs.readdirSync(dir).forEach((n) => {
                    candidates.push(join(name, n));
                });
            }
            candidates.push(name);
        });
        candidates.forEach((name) => {
            const infoFile = join(basePath, name, 'package.json');
            if (!fs.existsSync(infoFile)) {
                return;
            }

            const info = loadPackageInfo(infoFile);
            if (isPlugin(info)) {
                result.push(join(basePath, name));
            }
        });
    }

    /**
     * Load and parse the given `package.json`.
     */
    function loadPackageInfo(fileName: string): any {
        try {
            return JSON.parse(readFile(fileName));
        } catch (error) {
            logger.error('Could not parse %s', fileName);
            return {};
        }
    }

    /**
     * Test whether the given package info describes a TypeDoc plugin.
     */
    function isPlugin(info: any): boolean {
        const keywords: unknown[] = info.keywords;
        if (!keywords || !Array.isArray(keywords)) {
            return false;
        }

        return keywords.some(keyword => typeof keyword === 'string' && keyword.toLowerCase() === 'typedocplugin');
    }
}

function resolvePluginPaths(plugins: string[]) {
    const cwd = process.cwd();
    return plugins.map(plugin => {
        // treat plugins that start with `.` as relative, requiring resolution
        if (plugin.startsWith('.')) {
            return resolve(cwd, plugin);
        }
        return plugin;
    });
}
