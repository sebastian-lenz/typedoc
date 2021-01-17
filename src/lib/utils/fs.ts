import * as ts from "typescript";
import * as FS from "fs";
import { join, dirname } from "path";

/**
 * Get the longest directory path common to all files.
 */
export function getCommonDirectory(files: readonly string[]): string {
    if (!files.length) {
        return "";
    }

    const roots = files.map((f) => f.split(/\\|\//));
    if (roots.length === 1) {
        return roots[0].slice(0, -1).join("/");
    }

    let i = 0;

    while (new Set(roots.map((part) => part[i])).size === 1) {
        i++;
    }

    return roots[0].slice(0, i).join("/");
}

/**
 * List of known existent directories. Used to speed up [[directoryExists]].
 */
const existingDirectories = new Set<string>();

/**
 * Normalize the given path.
 *
 * @param path  The path that should be normalized.
 * @returns The normalized path.
 */
export function normalizePath(path: string) {
    return path.replace(/\\/g, "/");
}

/**
 * Test whether the given directory exists.
 *
 * @param directoryPath  The directory that should be tested.
 * @returns TRUE if the given directory exists, FALSE otherwise.
 */
export function directoryExists(directoryPath: string): boolean {
    if (existingDirectories.has(directoryPath)) {
        return true;
    }

    if (ts.sys.directoryExists(directoryPath)) {
        existingDirectories.add(directoryPath);
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
 * Write a file to disc.
 *
 * If the containing directory does not exist it will be created.
 *
 * @param fileName  The name of the file that should be written.
 * @param data  The contents of the file.
 * @param writeByteOrderMark  Whether the UTF-8 BOM should be written or not.
 * @param onError  A callback that will be invoked if an error occurs.
 */
export function writeFile(
    fileName: string,
    data: string,
    writeByteOrderMark: boolean,
    onError?: (message: string) => void
) {
    try {
        ensureDirectoriesExist(dirname(normalizePath(fileName)));
        ts.sys.writeFile(fileName, data, writeByteOrderMark);
    } catch (e) {
        if (onError) {
            onError(e.message);
        }
    }
}

/**
 * Load the given file and return its contents.
 *
 * @param file  The path of the file to read.
 * @returns The files contents.
 */
export function readFile(file: string): string {
    const buffer = FS.readFileSync(file);
    switch (buffer[0]) {
        case 0xfe:
            if (buffer[1] === 0xff) {
                let i = 0;
                while (i + 1 < buffer.length) {
                    const temp = buffer[i];
                    buffer[i] = buffer[i + 1];
                    buffer[i + 1] = temp;
                    i += 2;
                }
                return buffer.toString("ucs2", 2);
            }
            break;
        case 0xff:
            if (buffer[1] === 0xfe) {
                return buffer.toString("ucs2", 2);
            }
            break;
        case 0xef:
            if (buffer[1] === 0xbb) {
                return buffer.toString("utf8", 3);
            }
    }

    return buffer.toString("utf8", 0);
}

/**
 * Copy a file or directory recursively.
 */
export async function copy(src: string, dest: string): Promise<void> {
    const stat = FS.statSync(src);

    if (stat.isDirectory()) {
        const contained = FS.readdirSync(src);
        contained.forEach((file) => copy(join(src, file), join(dest, file)));
    } else if (stat.isFile()) {
        FS.mkdirSync(dirname(dest), { recursive: true });
        FS.copyFileSync(src, dest);
    } else {
        // Do nothing for FIFO, special devices.
    }
}

/**
 * Recursive rmdir. Node v12.10.0 adds the { recursive: true } option to
 * the native fs rmdir function, but we don't require Node 12 yet.
 * @param target
 */
export function remove(target: string) {
    let isFile: boolean;
    try {
        const stat = FS.lstatSync(target);
        isFile = !stat.isDirectory();
    } catch {
        return;
    }

    if (isFile) {
        return FS.unlinkSync(target);
    } else {
        const files = FS.readdirSync(target);
        files.forEach((file) => remove(join(target, file)));
        FS.rmdirSync(target);
    }
}
