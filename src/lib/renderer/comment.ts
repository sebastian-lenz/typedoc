// Comments are special. Users can include markdown which will be rendered. They can also use [[include: file]]
// to include a file within their comment, or media://file to link to images or attachments.

import { Reflection } from "../models";
import { ThemeRouter } from "./router";
import * as Marked from "marked";
import * as path from "path";
import { Logger } from "../utils";
import { readFileSync, existsSync } from "fs";
import { DoubleHighlighter } from "./highlight";

// TODO: {@link}, [[link]]

export function parseMarkdown(
  markdown: string,
  reflection: Reflection,
  router: ThemeRouter,
  highlighter: DoubleHighlighter
): string {
  const renderer = new Marked.Renderer();
  renderer.heading = (text, level, raw) => {
    const slug = router.createSlug(reflection, raw);
    return `<h${level}><a href="#${slug}" id="${slug}">${text}</a></h${level}>`;
  };

  Marked.use({
    renderer,
    highlight: (code, lang) => highlighter.highlight(code, lang),
  });

  return Marked(markdown);
}

const INCLUDE_PATTERN = /\[\[include:([^\]]+?)\]\]/g;

export function replaceIncludes(
  includesDir: string,
  text: string,
  logger: Logger
): string {
  if (includesDir === "") {
    return text;
  }

  return text.replace(INCLUDE_PATTERN, (match, file) => {
    const resolved = path.join(includesDir, file.trim());
    try {
      return readFileSync(resolved, "utf-8");
    } catch {
      logger.error(`Could not find file to include: ${file} => ${resolved}`);
      return match;
    }
  });
}

const MEDIA_PATTERN = /media:\/\/([^ ")\]}]+)/g;

export function replaceMedia(
  mediaDir: string,
  text: string,
  logger: Logger,
  reflection: Reflection,
  router: ThemeRouter
): string {
  if (mediaDir === "") {
    return text;
  }

  return text.replace(MEDIA_PATTERN, (match, file) => {
    const resolved = path.join(mediaDir, file.trim());
    if (existsSync(resolved)) {
      return router.createMediaLink(reflection, file);
    } else {
      logger.error(`Could not find media file: ${file} => ${resolved}`);
      return match;
    }
  });
}
