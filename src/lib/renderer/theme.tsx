import * as assert from "assert";
import { promises as fs, readFileSync } from "fs";
import { dirname, join } from "path";
import { createElement } from "preact";
import { render } from "preact-render-to-string";
import type { Application } from "../application";
import type { ProjectReflection, Reflection, SomeReflection } from "../models";
import { defaultTemplates } from "./default-templates";
import {
  MinimalThemeRouter,
  ThemeRouter,
  ThemeRouterConstructor,
} from "./router";
import type { Templates } from "./templates";
import { parseMarkdown, replaceMedia, replaceIncludes } from "./comment";
import { DoubleHighlighter } from "./highlight";
import { copy } from "../utils/fs";

const STATIC_DIR = join(__dirname, "../../../static");

// Keep this small, it will be inlined on EVERY page.
const THEME_JS = readFileSync(join(STATIC_DIR, "theme.js"), "utf-8").trim();

const writeFile = async (path: string, content: string) => {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, content);
};

const copyFile = async (src: string, dest: string) => {
  await fs.mkdir(dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
};

export type Theme = (
  app: Application,
  project: ProjectReflection,
  outDir: string
) => Promise<void>;

export function buildTheme(
  routerCtor: ThemeRouterConstructor,
  templates?: Partial<Templates>
): Theme {
  return async (app, project, outDir) => {
    const start = Date.now();
    const router = new routerCtor(project);
    const themeTemplates: Templates = { ...defaultTemplates, ...templates };
    // TODO: These ought to be configurable.
    const highlighter = await DoubleHighlighter.create(
      "light_plus",
      "monokai_dimmed"
    );

    app.renderer.hooks.on("body.begin", () => (
      <script dangerouslySetInnerHTML={{ __html: THEME_JS }} />
    ));

    const pages: Reflection[] = [project];
    const tasks: Promise<void>[] = [];

    function boundParseMarkdown(markdown: string, reflection: Reflection) {
      let result = replaceIncludes(
        app.options.getValue("includes"),
        markdown,
        app.logger
      );
      result = replaceMedia(
        app.options.getValue("media"),
        result,
        app.logger,
        reflection,
        router
      );
      result = parseMarkdown(markdown, reflection, router, highlighter);
      return result;
    }

    let page = pages.shift();
    while (page) {
      assert(router.hasOwnDocument(page));

      const path = router.getDocumentName(page);
      app.logger.verbose(`${page.getFullName()} ===> ${path}`);
      const content =
        "<!DOCTYPE html>\n" +
        render(
          <themeTemplates.Page
            hooks={app.renderer.hooks}
            reflection={page as SomeReflection}
            router={router}
            parseMarkdown={boundParseMarkdown}
            templates={themeTemplates}
          />,
          null,
          { pretty: true }
        );
      tasks.push(writeFile(join(outDir, path), content));

      if (page.isContainer()) {
        pages.push(
          ...page.children.filter((child) => router.hasOwnDocument(child))
        );
      }

      page = pages.shift();
    }

    // Copy static files
    tasks.push(
      copyFile(
        join(STATIC_DIR, "style.css"),
        join(outDir, router.getAssetDirectory(), "style.css")
      )
    );

    // Write theme css
    tasks.push(
      writeFile(
        join(outDir, router.getAssetDirectory(), "theme.css"),
        highlighter.getStyles()
      )
    );

    if (app.options.getValue("media")) {
      tasks.push(
        copy(
          app.options.getValue("media"),
          join(outDir, router.getMediaDirectory())
        )
      );
    }

    await Promise.all(tasks);
    app.logger.verbose(`[Perf] Theme output took ${Date.now() - start}ms`);
  };
}

export const defaultTheme = buildTheme(ThemeRouter);
export const minimalTheme = buildTheme(MinimalThemeRouter);
