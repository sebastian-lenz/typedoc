import { ok as assert } from "assert";

import {
  getHighlighter,
  getTheme,
  commonLangIds,
  commonLangAliases,
  otherLangIds,
} from "shiki";
// This is bad... but Shiki doesn't export it from the root.
import type { Highlighter } from "shiki/dist/highlighter";

import type { TLang } from "shiki-languages";
import type { TTheme } from "shiki-themes";

import { createElement, JSX, Fragment } from "preact";
import { render } from "preact-render-to-string";

import * as Color from "color";

const supportedLanguages: Set<string> = new Set([
  ...commonLangIds,
  ...commonLangAliases,
  ...otherLangIds,
]);

export class DoubleHighlighter {
  // light | dark => class
  private schemes = new Map<string, string>();
  // class => [light, dark]
  private reverseSchemes = new Map<string, [string?, string?]>();

  static async create(
    lightTheme: TTheme,
    darkTheme: TTheme
  ): Promise<DoubleHighlighter> {
    const light = getTheme(lightTheme).bg;
    const dark = getTheme(darkTheme).bg;
    const [lightHl, darkHl] = await Promise.all([
      getHighlighter({ theme: lightTheme }),
      getHighlighter({ theme: darkTheme }),
    ]);
    return new DoubleHighlighter(lightHl, light, darkHl, dark);
  }

  private constructor(
    private light: Highlighter,
    readonly lightBg: string,
    private dark: Highlighter,
    readonly darkBg: string
  ) {}

  highlight(code: string, lang: string): string {
    // We don't know what this language is... just return the text.
    if (!supportedLanguages.has(lang)) {
      return code;
    }

    const lightTokens = this.light.codeToThemedTokens(code, lang as TLang);
    const darkTokens = this.dark.codeToThemedTokens(code, lang as TLang);

    // If this fails... something went *very* wrong.
    assert(lightTokens.length === darkTokens.length);

    const docEls: JSX.Element[][] = [];

    for (let line = 0; line < lightTokens.length; line++) {
      const lightLine = lightTokens[line];
      const darkLine = darkTokens[line];

      // Different themes can have different grammars... so unfortunately we have to deal with different
      // sets of tokens.Example: light_plus and dark_plus tokenize " = " differently in the `schemes`
      // declaration for this file.

      const lineEls: JSX.Element[] = [];

      while (lightLine.length && darkLine.length) {
        // Simple case, same token.
        if (lightLine[0].content.length === darkLine[0].content.length) {
          lineEls.push(
            <span class={this.getClass(lightLine[0].color, darkLine[0].color)}>
              {lightLine[0].content}
            </span>
          );
          lightLine.shift();
          darkLine.shift();
          continue;
        }

        if (lightLine[0].content.length < darkLine[0].content.length) {
          lineEls.push(
            <span class={this.getClass(lightLine[0].color, darkLine[0].color)}>
              {lightLine[0].content}
            </span>
          );
          darkLine[0].content = darkLine[0].content.substr(
            lightLine[0].content.length
          );
          lightLine.shift();
          continue;
        }

        lineEls.push(
          <span class={this.getClass(lightLine[0].color, darkLine[0].color)}>
            {darkLine[0].content}
          </span>
        );
        lightLine[0].content = lightLine[0].content.substr(
          darkLine[0].content.length
        );
        darkLine.shift();
      }

      lineEls.push(<br />);
      docEls.push(lineEls);
    }

    return render(<Fragment>{docEls}</Fragment>);
  }

  getStyles(): string {
    let styles =
      Array.from(this.reverseSchemes.values(), ([light, dark], i) => {
        return [
          `.hl-${i} { color: ${light}; }`,
          `.dark .hl-${i} { color: ${dark}; }`,
        ].join("\n");
      }).join("\n") + "\n";

    const lightBg = Color(this.lightBg);
    const darkBg = Color(this.darkBg);

    styles += `:root {
    --light-bg-hue: ${lightBg.hue()}deg;
    --dark-bg-hue: ${darkBg.hue()}deg;
    --light-bg-saturation: ${lightBg.saturationl()}%;
    --dark-bg-saturation: ${darkBg.saturationl()}%;
    --light-bg-lightness: ${lightBg.lightness()}%;
    --dark-bg-lightness: ${darkBg.lightness()}%;
    --light-bg-alpha: ${lightBg.alpha()};
    --dark-bg-alpha: ${darkBg.alpha()};
}\n`;

    return styles;
  }

  private getClass(lightColor?: string, darkColor?: string): string {
    // Rather arbitrary key, uses a separator that shouldn't ever appear in colors.
    const key = `${lightColor} | ${darkColor}`;
    let scheme = this.schemes.get(key);
    if (scheme == null) {
      scheme = `hl-${this.schemes.size}`;
      this.schemes.set(key, scheme);
      this.reverseSchemes.set(scheme, [lightColor, darkColor]);
    }
    return scheme;
  }
}
