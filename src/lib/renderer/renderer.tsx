import { ok as assert } from "assert";
import { join } from "path";
import type { VNode } from "preact";
import { createElement } from "preact";
import { render } from "preact-render-to-string";

import type { Application } from "../application";
import type { ProjectReflection, Reflection, SomeReflection } from "../models";
import {
  DeepPartial,
  EventHooks,
  Keys,
  remove,
  StringIfExternal,
  Writable,
} from "../utils";
import { waterfall } from "../utils/array";
import { writeFile } from "../utils/fs";
import { parseMarkdown, replaceIncludes, replaceMedia } from "./comment";
import { DoubleHighlighter } from "./highlight";
import type { ThemeRouter, ThemeRouterConstructor } from "./router";
import type { TemplateHooks, Templates } from "./templates";
import { defaultThemeDefinition, minimalThemeDefinition } from "./theme";

export type TypeDocThemes = "default" | "minimal";

export interface ThemeContext {
  highlighter: DoubleHighlighter;
  router: ThemeRouter;
  hooks: EventHooks<TemplateHooks, VNode | null>;
  outDir: string;
  app: Application;
}

export type BuiltinThemeActions = Keys<
  typeof defaultThemeDefinition["preRender" | "postRender"]
>;

export interface ThemeDefinition {
  /**
   * The router used by this theme. If not set, will use default {@link ThemeRouter}.
   */
  readonly router: ThemeRouterConstructor;

  /**
   * The templates used by this theme. If not set, will use the default templates.
   */
  readonly templates: Templates;

  /**
   * Actions performed before rendering the project with this theme's templates.
   */
  readonly preRender: Record<
    string,
    (context: ThemeContext) => Promise<void> | void
  >;

  /**
   * Actions performed after rendering the project with this theme's templates.
   */
  readonly postRender: Record<
    string,
    (context: ThemeContext) => Promise<void> | void
  >;
}

export interface ThemeConfiguration extends DeepPartial<ThemeDefinition> {
  /**
   * An optional theme to inherit settings from.
   */
  readonly parent?: StringIfExternal<TypeDocThemes>;

  /**
   * Any pre-render or post-render actions which need to be disabled by this theme.
   */
  readonly suppress?: readonly StringIfExternal<BuiltinThemeActions>[];
}

export class Renderer {
  private _themes = new Map<string, ThemeDefinition>();

  /**
   * Hooks which plugins can use to modify the rendered output.
   * Any hooks added during a render will only be retained for that render call.
   */
  readonly hooks = new EventHooks<TemplateHooks, VNode | null>();

  constructor(readonly application: Application) {
    this._themes.set("default", defaultThemeDefinition);
    this.addTheme("minimal", minimalThemeDefinition);
  }

  private get logger() {
    return this.application.logger;
  }

  /**
   * Renders the given project using the currently selected theme.
   * @param project
   * @param out
   */
  async render(project: ProjectReflection, out: string): Promise<void> {
    const start = Date.now();
    const theme = this.getTheme(this.application.options.getValue("theme"));
    const momento = this.hooks.saveMomento();

    if (this.application.options.getValue("cleanOutputDir")) {
      await remove(out);
    }

    const router = new theme.router(project);
    // TODO: These ought to be configurable.
    const highlighter = await DoubleHighlighter.create(
      "light-plus",
      "dark-plus"
    );

    const context: ThemeContext = {
      highlighter,
      router,
      hooks: this.hooks,
      outDir: out,
      app: this.application,
    };

    // It seems like this ought to live elsewhere...
    const boundParseMarkdown = (markdown: string, reflection: Reflection) => {
      let result = replaceIncludes(
        this.application.options.getValue("includes"),
        markdown,
        this.application.logger
      );
      result = replaceMedia(
        this.application.options.getValue("media"),
        result,
        this.application.logger,
        reflection,
        router
      );
      return parseMarkdown(markdown, reflection, router, highlighter);
    };

    this.logger.verbose(
      `Running pre-render actions: ${
        Object.keys(theme.preRender).join(", ") || "none"
      }`
    );
    const beforePreRender = Date.now();
    await waterfall(Object.values(theme.preRender), (action) =>
      action(context)
    );
    const afterPre = Date.now();
    this.logger.verbose(
      `[Perf] Pre-render actions took ${afterPre - beforePreRender}ms`
    );

    const pages: Reflection[] = [project];
    const tasks: Promise<void>[] = [];

    let page = pages.shift();
    while (page) {
      assert(router.hasOwnDocument(page));

      const path = router.getDocumentName(page);
      this.logger.verbose(`${page.getFullName()} ===> ${path}`);
      const content =
        "<!DOCTYPE html>\n" +
        render(
          <theme.templates.Page
            hooks={this.hooks}
            reflection={page as SomeReflection}
            router={router}
            parseMarkdown={boundParseMarkdown}
            templates={theme.templates}
            highlighter={highlighter}
          />,
          null,
          { pretty: false }
        );
      tasks.push(writeFile(join(out, path), content));

      if (page.isContainer()) {
        pages.push(
          ...page.children.filter((child) => router.hasOwnDocument(child))
        );
      }

      page = pages.shift();
    }

    const afterRender = Date.now();
    this.logger.verbose(
      `[Perf] Template rendering took ${afterRender - afterPre}ms`
    );

    this.logger.verbose(
      `Running post-render actions: ${
        Object.keys(theme.postRender).join(", ") || "none"
      }`
    );
    await waterfall(Object.values(theme.postRender), (action) =>
      action(context)
    );
    const afterPost = Date.now();
    this.logger.verbose(
      `[Perf] Post-render actions took ${afterPost - afterRender}ms`
    );

    this.hooks.restoreMomento(momento);
    this.logger.verbose(`[Perf] Full render took ${afterPost - start}ms`);
  }

  /**
   * Adds a theme to TypeDoc that can be specified with `--theme`.
   * @param name
   * @param theme
   */
  addTheme(name: string, theme: ThemeConfiguration): void {
    if (this._themes.has(name)) {
      throw new Error(`The theme "${name}" has already been defined.`);
    }

    const definition = cloneDefinition(
      theme.parent ? this.getTheme(theme.parent) : defaultThemeDefinition
    );

    if (theme.router) {
      definition.router = theme.router;
    }

    if (theme.templates) {
      Object.assign(definition.templates, theme.templates);
    }

    if (theme.preRender) {
      Object.assign(definition.preRender, theme.preRender);
    }

    if (theme.postRender) {
      Object.assign(definition.postRender, theme.postRender);
    }

    for (const item in theme.suppress ?? []) {
      delete definition.preRender[item];
      delete definition.postRender[item];
    }

    this._themes.set(name, definition);
  }

  /**
   * Gets a defined theme, throws if it does not exist.
   *
   * Note: `string & {}` is used here to trick TS into providing autocomplete for
   * the builtin actions while also allowing any string.
   */
  private getTheme(name: TypeDocThemes | (string & {})): ThemeDefinition {
    const theme = this._themes.get(name);
    if (!theme) {
      throw new Error(`The theme "${name}" has not been defined`);
    }
    return theme;
  }
}

// No need to pull in a new package for deep cloning... we only need one level.
function cloneDefinition(def: ThemeDefinition): Writable<ThemeDefinition> {
  return {
    router: def.router,
    templates: { ...def.templates },
    preRender: { ...def.preRender },
    postRender: { ...def.postRender },
  };
}
