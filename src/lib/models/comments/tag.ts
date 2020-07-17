/**
 * A model that represents a single comment tag.
 *
 * Tags are stored in the {@link Comment.tags} property.
 */
export class CommentTag {
  /**
   * The name of this tag.
   */
  tagName: string;

  /**
   * The name of the related parameter when this is a `@param` or `@template` tag.
   */
  paramName?: string;

  /**
   * The body text of this tag.
   */
  text: string;

  /**
   * Create a new CommentTag instance.
   */
  constructor(tagName: string, text?: string, paramName?: string) {
    this.tagName = tagName;
    this.text = text || "";
    this.paramName = paramName;
  }

  /**
   * Creates a copy of this tag.
   */
  clone(): CommentTag {
    return new CommentTag(this.tagName, this.paramName, this.text);
  }
}
