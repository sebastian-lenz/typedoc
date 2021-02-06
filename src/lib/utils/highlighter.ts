import { ok as assert } from "assert";
import * as shiki from "shiki";
import { unique } from "./array";

// This is needed because Shiki includes some "fake" languages
// ts / js are expected by users to be equivalent to typescript / javascript

const aliases = new Map<string, string>([
    ["ts", "typescript"],
    ["js", "javascript"],
    ["bash", "shellscript"],
    ["sh", "shellscript"],
    ["shell", "shellscript"],
]);

const supportedLanguages = unique([
    "text",
    ...aliases.keys(),
    ...shiki.BUNDLED_LANGUAGES.map((lang) => lang.id),
]).sort();

let highlighter: shiki.Highlighter | undefined;

export async function loadHighlighter(theme: shiki.Theme) {
    if (highlighter) return;
    highlighter = await shiki.getHighlighter({ theme });
}

export function isSupportedLanguage(lang: string) {
    return getSupportedLanguages().includes(lang);
}

export function getSupportedLanguages(): string[] {
    return supportedLanguages;
}

export function highlight(
    code: string,
    lang: string,
    theme: shiki.Theme
): string {
    assert(highlighter, "Tried to highlight with an uninitialized highlighter");
    if (!isSupportedLanguage(lang)) {
        return code;
    }

    if (lang === "text") {
        return escapeHtml(code);
    }

    lang = aliases.get(lang) ?? lang;

    const result: string[] = [];
    for (const line of highlighter.codeToThemedTokens(code, lang, theme, {
        includeExplanation: false,
    })) {
        for (const token of line) {
            result.push(
                `<span style="color: ${token.color ?? "#000"}">`,
                escapeHtml(token.content),
                "</span>"
            );
        }
        result.push("\n");
    }
    return result.join("");
}

function escapeHtml(text: string) {
    return text.replace(
        /[&<>"']/g,
        (match) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
            }[match as never])
    );
}
