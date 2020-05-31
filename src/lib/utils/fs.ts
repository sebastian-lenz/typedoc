import * as ts from 'typescript';
import * as fs from 'fs-extra';
import { dirname, resolve, join } from 'path';
import { createMinimatch } from './paths';

/**
 * List of known existent directories. Used to speed up [[directoryExists]].
 */
const existingDirectories: ts.MapLike<boolean> = {};

/**
 * Normalize the given path.
 *
 * @param path  The path that should be normalized.
 * @returns The normalized path.
 */
export function normalizePath(path: string) {
    return path.replace(/\\/g, '/');
}

/**
 * Test whether the given directory exists.
 *
 * @param directoryPath  The directory that should be tested.
 * @returns TRUE if the given directory exists, FALSE otherwise.
 */
export function directoryExists(directoryPath: string): boolean {
    if (existingDirectories.hasOwnProperty(directoryPath)) {
        return true;
    }

    if (ts.sys.directoryExists(directoryPath)) {
        existingDirectories[directoryPath] = true;
        return true;
    }

    return false;
}

/**
 * Make sure that the given directory exists.
 *
 * @param directoryPath  The directory that should be validated.
 */
export function ensureDirectoriesExist(directoryPath: string) {
    if (!directoryExists(directoryPath)) {
        const parentDirectory = dirname(directoryPath);
        ensureDirectoriesExist(parentDirectory);
        ts.sys.createDirectory(directoryPath);
    }
}

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
 * Expand a list of input files and directories to get input files for a program.
 *
 * @param inputFiles The list of files that should be expanded.
 * @param excludePatterns Patterns to test files not in the inputFiles parameter against for exclusion.
 * @param allowJs Whether or not to include JS files in the result.
 * @returns The list of input files with expanded directories.
 */
export async function expandDirectories(inputFiles: string[], excludePatterns: string[], allowJs: boolean): Promise<string[]> {
    const files: string[] = [];

    const exclude = createMinimatch(excludePatterns);
    const supportedFileRegex = allowJs ? /\.[tj]sx?$/ : /\.tsx?$/;

    function isExcluded(fileName: string): boolean {
        return exclude.some(mm => mm.match(fileName));
    }

    async function add(file: string, entryPoint: boolean) {
        let stats: fs.Stats;
        try {
            stats = await fs.stat(file);
        } catch {
            // No permission or a symbolic link, do not resolve.
            return;
        }
        const fileIsDir = stats.isDirectory();
        if (fileIsDir && !file.endsWith('/')) {
            file = `${file}/`;
        }

        if (!entryPoint && isExcluded(file.replace(/\\/g, '/'))) {
            return;
        }

        if (fileIsDir) {
            const children = await fs.readdir(file);
            await Promise.all(children.map(child => add(join(file, child), false)))
        } else if (supportedFileRegex.test(file)) {
            files.push(file);
        }
    }

    await Promise.all(inputFiles.map(file => add(resolve(file), true)));

    return files;
}
