import * as fs from 'fs-extra';
import { resolve, join } from 'path';
import { createMinimatch } from './paths';
import type { Logger } from './loggers'

/**
 * Load the given file and return its contents.
 *
 * @param file  The path of the file to read.
 * @returns The files contents.
 */
export function readFile(file: string): string {
    const buffer = fs.readFileSync(file);
    switch (buffer[0]) {
        case 0xFE:
            if (buffer[1] === 0xFF) {
                let i = 0;
                while ((i + 1) < buffer.length) {
                    const temp = buffer[i];
                    buffer[i] = buffer[i + 1];
                    buffer[i + 1] = temp;
                    i += 2;
                }
                return buffer.toString('ucs2', 2);
            }
            break;
        case 0xFF:
            if (buffer[1] === 0xFE) {
                return buffer.toString('ucs2', 2);
            }
            break;
        case 0xEF:
            if (buffer[1] === 0xBB) {
                return buffer.toString('utf8', 3);
            }
    }

    return buffer.toString('utf8', 0);
}

/**
 * Get the longest directory path common to all files.
 *
 * Used to infer a root directory for a project based on the input files if `rootDir` is not set.
 * @param files
 */
export function getCommonDirectory(files: readonly string[]): string {
    if (!files.length) {
        return '';
    }

    const roots = files.map(f => f.split(/\\|\//));
    let i = 0;

    while (new Set(roots.map(part => part[i])).size === 1) {
        i++;
    }

    return roots[0].slice(0, i).join('/');
}

/**
 * Expand a list of input files and directories to get input files for a program.
 *
 * @param inputFiles The list of files that should be expanded.
 * @param excludePatterns Patterns to test files not in the inputFiles parameter against for exclusion.
 * @param allowJs Whether or not to include JS files in the result.
 * @param includeDeclarations Whether or not to include declaration files in the result.
 * @returns The list of input files with expanded directories.
 */
export async function expandDirectories(
    inputFiles: readonly string[],
    excludePatterns: readonly string[],
    allowJs: boolean,
    includeDeclarations: boolean,
    logger?: Logger
): Promise<string[]> {
    const files: string[] = [];

    const exclude = createMinimatch(excludePatterns);
    const supportedFileRegex = allowJs ? /\.[tj]sx?$/ : /\.tsx?$/;

    function isDeclarationFile(fileName: string) {
        return /\.d\.tsx?$/.test(fileName);
    }

    function isExcluded(fileName: string): boolean {
        return exclude.some(mm => mm.match(fileName));
    }

    async function add(file: string, entryPoint: boolean) {
        let stats: fs.Stats;
        try {
            stats = await fs.stat(file);
        } catch {
            // No permission or a symbolic link, do not resolve.
            if (entryPoint) {
                logger?.error(`Entry point ${file} does not exist or cannot be read.`);
            }
            return;
        }
        const fileIsDir = stats.isDirectory();
        if (fileIsDir && !file.endsWith('/')) {
            file = `${file}/`;
        }

        if (!entryPoint && isExcluded(file.replace(/\\/g, '/'))) {
            return;
        }

        if (!entryPoint && !includeDeclarations && isDeclarationFile(file)) {
            return;
        }

        if (fileIsDir) {
            const children = await fs.readdir(file);
            await Promise.all(children.map(child => add(join(file, child), false)));
        } else if (supportedFileRegex.test(file)) {
            files.push(file);
        }
    }

    await Promise.all(inputFiles.map(file => add(resolve(file), true)));

    return files;
}
