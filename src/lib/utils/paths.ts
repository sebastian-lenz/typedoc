import * as Path from "path";
import { Minimatch, IMinimatch } from "minimatch";

const unix = Path.sep === "/";

function normalize(pattern: string): string {
  if (pattern.startsWith("!") || pattern.startsWith("#")) {
    return pattern[0] + normalize(pattern.substr(1));
  }

  if (unix) {
    pattern = pattern.replace(/[\\]/g, "/").replace(/^\w:/, "");
  }

  // pattern paths not starting with '**' are resolved even if it is an
  // absolute path, to ensure correct format for the current OS
  if (pattern.substr(0, 2) !== "**") {
    pattern = Path.resolve(pattern);
  }

  // On Windows we transform `\` to `/` to unify the way paths are interpreted
  if (!unix) {
    pattern = pattern.replace(/[\\]/g, "/");
  }

  return pattern;
}

/**
 * Convert array of glob patterns to array of minimatch instances.
 *
 * Handle a few Windows-Unix path gotchas.
 */
export function createMinimatch(patterns: readonly string[]): IMinimatch[] {
  return patterns.map(
    (pattern) => new Minimatch(normalize(pattern), { dot: true })
  );
}
