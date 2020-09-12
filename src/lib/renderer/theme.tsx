import { readFileSync } from "fs";
import { join } from "path";
import { createElement } from "preact";

import { copy, copyFile, writeFile } from "../utils/fs";
import { DefaultTemplates } from "./default-templates";
import type { ThemeContext } from "./renderer";
import { MinimalThemeRouter, ThemeRouter } from "./router";

const STATIC_DIR = join(__dirname, "../../../static");

// Keep this small, it will be inlined on EVERY page.
const THEME_JS = readFileSync(join(STATIC_DIR, "theme.js"), "utf-8").trim();
const STYLE_CSS = readFileSync(join(STATIC_DIR, "style.css"), "utf-8").trim();

export const defaultThemeDefinition = {
  router: ThemeRouter,

  templates: DefaultTemplates,

  preRender: {
    "default:theme-switcher": ({ hooks }: ThemeContext) => {
      hooks.on("body.begin", () => (
        <script dangerouslySetInnerHTML={{ __html: THEME_JS }} />
      ));
    },
    "default:style.css": ({ hooks, router }: ThemeContext) => {
      hooks.on("head.end", (reflection) => (
        <link
          rel="stylesheet"
          href={router.createAssetLink(reflection, "style.css")}
        />
      ));
    },
    "default:theme.css": ({ hooks, router }: ThemeContext) => {
      hooks.on("head.end", (reflection) => (
        <link
          rel="stylesheet"
          href={router.createAssetLink(reflection, "theme.css")}
        />
      ));
    },
  },

  postRender: {
    "default:style.css": ({ outDir, router }: ThemeContext) => {
      return copyFile(
        join(STATIC_DIR, "style.css"),
        join(outDir, router.getAssetDirectory(), "style.css")
      );
    },
    "default:theme.css": ({ outDir, router, highlighter }: ThemeContext) => {
      return writeFile(
        join(outDir, router.getAssetDirectory(), "theme.css"),
        highlighter.getStyles()
      );
    },
    "default:media": ({ app, outDir, router }: ThemeContext) => {
      if (app.options.getValue("media")) {
        return copy(
          app.options.getValue("media"),
          join(outDir, router.getMediaDirectory())
        );
      }
    },
  },
} as const;

export const minimalThemeDefinition = {
  router: MinimalThemeRouter,
  preRender: {
    "minimal:style": ({ hooks }: ThemeContext) => {
      hooks.on("head.end", () => (
        <style dangerouslySetInnerHTML={{ __html: STYLE_CSS }} />
      ));
    },
  },
  // Unfortunately, we can't disable default:theme.css here...
  // This should be possible if/when https://github.com/shikijs/shiki/issues/33#issuecomment-678589764 is done.
  suppress: ["default:style.css"],
} as const;
