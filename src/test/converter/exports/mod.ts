/**
 * A simple named export that will be exported from export.ts
 */
export const a = 1;

/**
 * An export of a local under a different name.
 */
export { a as b };

/**
 * An export with a module specifier that comes from this file.
 */
export { a as c } from "./mod";

/**
 * Will not be re-exported from export.ts using export * from...
 */
export default function () {
    console.log("Default");
}

/**
 * This is annotated with the hidden tag and will therefore not be included in the generated documentation.
 * This *would* cause a broken link since it is also re-exported from export.ts, but the CommentPlugin removes
 * broken links caused by hidden/ignore/internal tags.
 * @hidden
 */
export const hidden = true;

/**
 * This export is from a file external to the documentation that will not be included in the resulting docs.
 * No reference should be created.
 */
export { Node } from "typescript";

// TS 3.8 namespace exports
export * as ThisModule from "./mod";

export type GH1453Helper = `1`;
