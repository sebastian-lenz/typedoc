import * as Util from 'util';

import { Reflection } from '../../models/reflections/abstract';
import { Component, ContextAwareRendererComponent } from '../components';
import { MarkdownEvent, RendererEvent } from '../events';
import { BindOption } from '../../utils';

/**
 * A plugin that builds links in markdown texts.
 */
@Component({name: 'marked-links'})
export class MarkedLinksPlugin extends ContextAwareRendererComponent {
    /**
     * Regular expression for detecting bracket links.
     */
    private brackets: RegExp = /\[\[([^\]]+)\]\]/g;

    /**
     * Regular expression for detecting inline tags like {&amp;link ...}.
     */
    private inlineTag: RegExp = /(?:\[(.+?)\])?\{@(link|linkcode|linkplain)\s+((?:.|\n)+?)\}/gi;

    @BindOption('listInvalidSymbolLinks')
    listInvalidSymbolLinks!: boolean;

    private warnings: string[] = [];

    /**
     * Create a new MarkedLinksPlugin instance.
     */
    initialize() {
        super.initialize();
        this.listenTo(this.owner, {
            [MarkdownEvent.PARSE]: this.onParseMarkdown,
            [RendererEvent.END]: this.onEndRenderer
        }, undefined, 100);
    }

    /**
     * Find all references to symbols within the given text and transform them into a link.
     *
     * This function is aware of the current context and will try to find the symbol within the
     * current reflection. It will walk up the reflection chain till the symbol is found or the
     * root reflection is reached. As a last resort the function will search the entire project
     * for the given symbol.
     *
     * @param text  The text that should be parsed.
     * @returns The text with symbol references replaced by links.
     */
    private replaceBrackets(text: string): string {
        return text.replace(this.brackets, (match: string, content: string): string => {
            const monospace = content[0] === '`' && content[content.length - 1] === '`';
            const split = MarkedLinksPlugin.splitLinkText(monospace ? content.slice(1, -1) : content);
            return this.buildLink(match, split.target, split.caption, monospace);
        });
    }

    /**
     * Find symbol {&amp;link ...} strings in text and turn into html links
     *
     * @param text  The string in which to replace the inline tags.
     * @return      The updated string.
     */
    private replaceInlineTags(text: string): string {
        return text.replace(this.inlineTag, (match: string, leading: string, tagName: string, content: string): string => {
            const split   = MarkedLinksPlugin.splitLinkText(content);
            const target  = split.target;
            const caption = leading || split.caption;
            const monospace = tagName === 'linkcode';

            return this.buildLink(match, target, caption, monospace);
        });
    }

    /**
     * Format a link with the given text and target.
     *
     * @param original   The original link string, will be returned if the target cannot be resolved..
     * @param target     The link target.
     * @param caption    The caption of the link.
     * @param monospace  Whether to use monospace formatting or not.
     * @returns A html link tag.
     */
    private buildLink(original: string, target: string, caption: string, monospace?: boolean): string {
        let attributes = '';
        if (this.urlPrefix.test(target)) {
            attributes = ' class="external"';
        } else {
            let reflection: Reflection | undefined;
            if (this.reflection) {
                reflection = this.reflection.findReflectionByName(target);
            } else if (this.project) {
                reflection = this.project.findReflectionByName(target);
            }

            if (reflection && reflection.url) {
                if (this.urlPrefix.test(reflection.url)) {
                    target = reflection.url;
                    attributes = ' class="external"';
                } else {
                    target = this.getRelativeUrl(reflection.url);
                }
            } else {
                const fullName = (this.reflection || this.project)!.getFullName();
                this.warnings.push(`In ${fullName}: ${original}`);
                return original;
            }
        }

        if (monospace) {
            caption = '<code>' + caption + '</code>';
        }

        return Util.format('<a href="%s"%s>%s</a>', target, attributes, caption);
    }

    /**
     * Triggered when [[MarkedPlugin]] parses a markdown string.
     *
     * @param event
     */
    onParseMarkdown(event: MarkdownEvent) {
        event.parsedText = this.replaceInlineTags(this.replaceBrackets(event.parsedText));
    }

    /**
     * Triggered when [[Renderer]] is finished
     */
    onEndRenderer(event: RendererEvent) {
        if (this.listInvalidSymbolLinks && this.warnings.length > 0) {
            this.application.logger.write('');
            this.application.logger.warn('[MarkedLinksPlugin]: Found invalid symbol reference(s) in JSDocs, ' +
                'they will not render as links in the generated documentation.');

            for (let warning of this.warnings) {
                this.application.logger.write('  ' + warning);
            }
        }
    }

    /**
     * Split the given link into text and target at first pipe or space.
     *
     * @param text  The source string that should be checked for a split character.
     * @returns An object containing the link text and target.
     */
    static splitLinkText(text: string): { caption: string; target: string; } {
        let splitIndex = text.indexOf('|');
        if (splitIndex === -1) {
            splitIndex = text.search(/\s/);
        }

        if (splitIndex !== -1) {
            return {
                caption: text.substr(splitIndex + 1).replace(/\n+/, ' ').trim(),
                target: text.substr(0, splitIndex).trim()
            };
        } else {
            return {
                caption: text,
                target: text
            };
        }
    }
}
