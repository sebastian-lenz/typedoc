import { CommentTag } from './tag';

/**
 * A model that represents a TypeDoc comment.
 *
 * Comments are created by the {@link CommentPlugin} and {@link DeepCommentPlugin}.
 */
export class Comment {
    /**
     * The abstract of the comment. TypeDoc interprets the first paragraph of a comment
     * as the abstract.
     */
    shortText: string;

    /**
     * The full body text of the comment. Excludes the {@link shortText}.
     */
    text: string;

    /**
     * The text of the `@returns` tag if present.
     */
    returns?: string;

    /**
     * All associated tags.
     */
    tags?: CommentTag[];

    /**
     * Creates a new Comment instance.
     */
    constructor(shortText?: string, text?: string) {
        this.shortText = shortText || '';
        this.text = text || '';
    }

    /**
     * Has this comment a visible component?
     *
     * @returns TRUE when this comment has a visible component.
     */
    hasVisibleComponent(): boolean {
        return !!this.shortText || !!this.text || !!this.tags;
    }

    /**
     * Test whether this comment contains a tag with the given name.
     *
     * @param tagName  The name of the tag to look for.
     * @returns TRUE when this comment contains a tag with the given name, otherwise FALSE.
     */
    hasTag(tagName: string): boolean {
        return this.tags?.some(tag => tag.tagName === tagName) ?? false;
    }

    /**
     * Return the first tag with the given name.
     *
     * You can optionally pass a parameter name that should be searched to.
     *
     * @param tagName  The name of the tag to look for.
     * @param paramName  An optional parameter name to look for.
     * @returns The found tag or undefined.
     */
    getTag(tagName: string, paramName?: string): CommentTag | undefined {
        return this.tags?.find(tag => {
            return tag.tagName === tagName && (paramName === void 0 || tag.paramName === paramName);
        });
    }

    /**
     * Removes all tags with the given tag name from this comment.
     * @param tagName
     */
    removeTags(tagName: string) {
        this.tags = this.tags?.filter(tag => tag.tagName !== tagName)
    }

    /**
     * Copy the data of the given comment into this comment.
     *
     * @param comment
     */
    copyFrom(comment: Comment) {
        this.shortText = comment.shortText;
        this.text = comment.text;
        this.returns = comment.returns;
        this.tags = comment.tags?.map(tag => tag.clone());
    }
}
