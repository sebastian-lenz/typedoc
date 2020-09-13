# Themes

A TypeDoc theme is made up of up to four parts.

- Pre-render actions
- Templates
- The router
- Post-render actions

A theme may specify any number of these parts. Any parts which are not specified will fall back to the parent theme.

```tsx
import { Application } from "typedoc";
import { readFileSync } from "fs";
import { join } from "path";

const myStyle = readFileSync(join(__dirname, "style.css"), "utf-8");

export function load(app: Application) {
  // Adds a theme which will behave identically to the default theme.
  app.renderer.addTheme("myTheme", {});

  // Adds a theme which will behave identically to the minimal theme, with
  // the exception that the styling has been replaced.
  app.renderer.addTheme("myTheme2", {
    parent: "minimal",
    suppress: ["minimal:style"],
    preRender: {
      "myTheme2:style": ({ hooks }: ThemeContext) => {
        hooks.on("head.end", () => (
          <style dangerouslySetInnerHTML={{ __html: myStyle }} />
        ));
      },
    },
  });
}
```

Themes may also specify the `suppress` key, which will disable pre-render or post-render actions defined by the parent theme. This is [used][1] by the minimal theme to disable writing `style.css` to the media directory, instead inlining it within the generated page.

## Templates

The most commonly overridden parts of a theme are the templates. Templates are defined using JSX and rendered through Preact. Preact is re-exported from the root TypeDoc export, and should be imported from there to ensure that your theme uses the same version as TypeDoc.

Themes which override templates can override one or more of the provided parent templates. As an example, this theme will remove the breadcrumbs on each page:

```tsx
import { Application, Preact } from "typedoc";

export function load(app: Application) {
  app.renderer.addTheme("myTheme3", {
    templates: {
      Breadcrumbs(props) {
        return <Preact.Fragment />;
      },
    },
  });
}
```

## Theme Router

The theme router determines which reflections get their own page, how directories are structured, and how links between pages are resolved.
The default router will create a new directory for each reflection that contains children which have their own page.

The `addTheme` call expects a router of type `ThemeRouterConstructor`, which will be constructed for each project rendered.

```ts
interface ThemeRouterConstructor {
  new (project: ProjectReflection): ThemeRouter;
}

interface ThemeRouter {
  createLink(from: Reflection, to: Reflection): string;
  createSlug(reflection: Reflection, header?: string): string;
  createAssetLink(from: Reflection, asset: string): string;
  getAssetDirectory(): string;
  createMediaLink(from: Reflection, media: string): string;
  getMediaDirectory(): string;
  getDocumentName(reflection: Reflection): string;
  hasOwnDocument(reflection: Reflection): boolean;
  getChildrenInPage(reflection: Reflection): SomeReflection[];
}
```

This is implemented with reasonable defaults by the `ThemeRouter` class, and extended by the `MinimalThemeRouter` to place all reflections on one page.
The reference implementation is in [`src/lib/renderer/router.ts`][3].

## Pre-render and post-render actions

In addition to these two main parts of themes, themes may also specify pre-render and post-render steps that will be run before and after the project is rendered through the templates. These steps should be used to copy static files, prepare or clean up temporary directories, or compile necessary JS for the theme.

Each action is given a unique ID (TypeDoc internally uses `<theme name>:<action>`) so that inheriting themes may disable parent actions if necessary. The order actions are called in is the same order as [OrdinaryOwnPropertyKeys][4] returns.

Actions may return a promise, which will be awaited before rendering begins (preRender) or is complete (postRender).

```ts
import { Application, ThemeContext } from "typedoc";

export function load(app: Application) {
  app.renderer.addTheme("myTheme4", {
    preRender: {
      logOutDir(context: ThemeContext) {
        console.log("Writing theme output to", context.outDir);
      },
    },
  });
}
```

[1]: https://github.com/TypeStrong/typedoc/blob/library-mode/src/lib/renderer/theme.tsx#L69
[2]: https://github.com/TypeStrong/typedoc/blob/library-mode/src/lib/renderer/templates.ts#L72
[3]: https://github.com/TypeStrong/typedoc/blob/library-mode/src/lib/renderer/router.ts
[4]: https://tc39.es/ecma262/#sec-ordinaryownpropertykeys
