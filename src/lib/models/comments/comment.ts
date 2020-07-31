import type { CommentTag } from "./tag";

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
   * All associated tags.
   */
  tags?: CommentTag[];

  /**
   * Creates a new Comment instance.
   */
  constructor(shortText = "", text = "") {
    this.shortText = shortText;
    this.text = text;
  }

  /**
   * Test whether this comment contains a tag with the given name.
   *
   * @param tagName  The name of the tag to look for.
   * @returns TRUE when this comment contains a tag with the given name, otherwise FALSE.
   */
  hasTag(tagName: string): boolean {
    return this.tags?.some((tag) => tag.tagName === tagName) ?? false;
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
    if (paramName !== undefined) {
      return this.tags?.find(
        (tag) => tag.tagName === tagName && tag.paramName === paramName
      );
    }
    return this.tags?.find((tag) => tag.tagName === tagName);
  }

  /**
   * Removes all tags with the given tag name from this comment.
   */
  removeTags(...tags: string[]): void {
    this.tags = this.tags?.filter((tag) => !tags.includes(tag.tagName));
  }

  /**
   * Copy the data of the given comment into this comment.
   *
   * @param comment
   */
  clone(): Comment {
    const clone = new Comment(this.shortText, this.text);
    clone.tags = this.tags?.map((tag) => tag.clone());
    return clone;
  }
}
