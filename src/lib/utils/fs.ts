import { promises as fs } from "fs";
import { resolve, join, dirname } from "path";
import { createMinimatch } from "./paths";
import type { Logger } from "./loggers";

/**
 * Get the longest directory path common to all files.
 *
 * Used to infer a root directory for a project based on the input files if `rootDir` is not set.
 * @param files
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
 * Expand a list of input files and directories to get input files for a program.
 *
 * @param entryPoint The list of files that should be expanded.
 * @param excludePatterns Patterns to test files not in the entryPoint parameter against for exclusion.
 * @param allowJs Whether or not to include JS files in the result.
 * @param includeDeclarations Whether or not to include declaration files in the result.
 * @returns The list of input files with expanded directories.
 */
export async function expandDirectories(
  entryPoint: readonly string[],
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
    return exclude.some((mm) => mm.match(fileName));
  }

  async function add(file: string, entryPoint: boolean) {
    let stats: import("fs").Stats;
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
    if (fileIsDir && !file.endsWith("/")) {
      file = `${file}/`;
    }

    if (!entryPoint && isExcluded(file.replace(/\\/g, "/"))) {
      return;
    }

    if (!entryPoint && !includeDeclarations && isDeclarationFile(file)) {
      return;
    }

    if (fileIsDir) {
      const children = await fs.readdir(file);
      await Promise.all(children.map((child) => add(join(file, child), false)));
    } else if (supportedFileRegex.test(file)) {
      files.push(file);
    }
  }

  await Promise.all(entryPoint.map((file) => add(resolve(file), true)));

  return files.sort();
}

/**
 * Copy a file or directory recursively.
 */
export async function copy(src: string, dest: string): Promise<void> {
  const stat = await fs.stat(src);

  if (stat.isDirectory()) {
    const contained = await fs.readdir(src);
    await Promise.all(
      contained.map((file) => copy(join(src, file), join(dest, file)))
    );
  } else if (stat.isFile()) {
    await fs.mkdir(dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  } else {
    // Do nothing for FIFO, special devices.
  }
}

/**
 * Async recursive rmdir. Node v12.10.0 adds the { recursive: true } option to
 * the native fs rmdir function, but we don't require Node 12 yet.
 * @param target
 */
export async function remove(target: string): Promise<void> {
  let isFile: boolean;
  try {
    const stat = await fs.lstat(target);
    isFile = !stat.isDirectory();
  } catch {
    return;
  }

  if (isFile) {
    return fs.unlink(target);
  } else {
    const files = await fs.readdir(target);
    await Promise.all(files.map((file) => remove(join(target, file))));
    return fs.rmdir(target);
  }
}
