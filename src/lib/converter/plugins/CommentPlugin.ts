import * as ts from "typescript";

import { Comment, CommentTag } from "../../models/comments/index";
import {
  Reflection,
  ReflectionFlag,
  ReflectionKind,
  TypeParameterReflection,
  DeclarationReflection,
  ProjectReflection,
} from "../../models/reflections/index";
import { Component, ConverterComponent } from "../components";
import { parseComment, getRawComment } from "../factories/comment";
import { Converter } from "../converter";
import { Context } from "../context";
import { partition, uniq } from "lodash";
import { SourceReference } from "../../models";
import { BindOption } from "../../utils";

declare module "../../models/reflections/abstract" {
  interface Reflection {
    /**
     * The parsed documentation comment attached to this reflection.
     * This is added by the {@link CommentPlugin}.
     */
    comment?: Comment;
  }
}

/**
 * These tags are not useful to display in the generated documentation.
 * They should be ignored when parsing comments. Any relevant type information
 * (for JS users) will be consumed by TypeScript and need not be preserved
 * in the comment.
 *
 * Note that param/arg/argument/return/returns are not present.
 * These tags will have their type information stripped when parsing, but still
 * provide useful information for documentation.
 */
const TAG_BLACKLIST = [
  "augments",
  "callback",
  "class",
  "constructor",
  "enum",
  "extends",
  "this",
  "type",
  "typedef",
];

/**
 * Structure used by [[ContainerCommentHandler]] to store discovered module comments.
 */
interface ModuleComment {
  /**
   * The module reflection this comment is targeting.
   */
  reflection: Reflection;

  /**
   * The full text of the best matched comment.
   */
  fullText: string;

  /**
   * Has the full text been marked as being preferred?
   */
  isPreferred: boolean;
}

/**
 * A handler that parses TypeDoc comments and attaches [[Comment]] instances to
 * the generated reflections.
 */
@Component({ name: "comment" })
export class CommentPlugin extends ConverterComponent {
  @BindOption("excludeTags")
  excludeTags!: string[];

  /**
   * List of discovered module comments.
   * Defined in this.onBegin
   */
  private comments!: { [id: number]: ModuleComment };

  /**
   * Create a new CommentPlugin instance.
   */
  initialize() {
    // this.listenTo(this.owner, {
    //     [Converter.EVENT_BEGIN]: this.onBegin,
    //     [Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
    //     [Converter.EVENT_CREATE_SIGNATURE]: this.onDeclaration,
    //     [Converter.EVENT_CREATE_TYPE_PARAMETER]: this.onCreateTypeParameter,
    //     [Converter.EVENT_FUNCTION_IMPLEMENTATION]: this.onFunctionImplementation,
    //     [Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
    //     [Converter.EVENT_RESOLVE]: this.onResolve
    // });
  }

  private storeModuleComment(comment: string, reflection: Reflection) {
    const isPreferred = comment.toLowerCase().includes("@preferred");

    if (this.comments[reflection.id]) {
      const info = this.comments[reflection.id];
      if (
        !isPreferred &&
        (info.isPreferred || info.fullText.length > comment.length)
      ) {
        return;
      }

      info.fullText = comment;
      info.isPreferred = isPreferred;
    } else {
      this.comments[reflection.id] = {
        reflection: reflection,
        fullText: comment,
        isPreferred: isPreferred,
      };
    }
  }

  /**
   * Apply all comment tag modifiers to the given reflection.
   *
   * @param reflection  The reflection the modifiers should be applied to.
   * @param comment  The comment that should be searched for modifiers.
   */
  private applyModifiers(reflection: Reflection, comment: Comment) {
    if (comment.hasTag("private")) {
      reflection.setFlag(ReflectionFlag.Private);
      comment.removeTags("private");
    }

    if (comment.hasTag("protected")) {
      reflection.setFlag(ReflectionFlag.Protected);
      comment.removeTags("protected");
    }

    if (comment.hasTag("public")) {
      reflection.setFlag(ReflectionFlag.Public);
      comment.removeTags("public");
    }

    if (comment.hasTag("event")) {
      reflection.kind = ReflectionKind.Event;
      // reflection.setFlag(ReflectionFlag.Event);
      comment.removeTags("event");
    }

    if (reflection.kindOf(ReflectionKind.Module)) {
      comment.removeTags("packagedocumentation");
    }
  }

  /**
   * Triggered when the converter begins converting a project.
   *
   * @param context  The context object describing the current state the converter is in.
   */
  private onBegin(context: Context) {
    this.comments = {};
  }

  /**
   * Triggered when the converter has created a type parameter reflection.
   *
   * @param context  The context object describing the current state the converter is in.
   * @param reflection  The reflection that is currently processed.
   * @param node  The node that is currently processed if available.
   */
  private onCreateTypeParameter(
    context: Context,
    reflection: TypeParameterReflection,
    node?: ts.Node
  ) {
    const comment = reflection.parent && reflection.parent.comment;
    if (comment) {
      let tag = comment.getTag("typeparam", reflection.name);
      if (!tag) {
        tag = comment.getTag("template", reflection.name);
      }
      if (!tag) {
        tag = comment.getTag("param", `<${reflection.name}>`);
      }
      if (!tag) {
        tag = comment.getTag("param", reflection.name);
      }

      if (tag) {
        reflection.comment = new Comment(tag.text);
        // comment.tags must be set if we found a tag.
        comment.tags!.splice(comment.tags!.indexOf(tag), 1);
      }
    }
  }

  /**
   * Triggered when the converter has created a declaration or signature reflection.
   *
   * Invokes the comment parser.
   *
   * @param context  The context object describing the current state the converter is in.
   * @param reflection  The reflection that is currently processed.
   * @param node  The node that is currently processed if available.
   */
  private onDeclaration(
    context: Context,
    reflection: Reflection,
    node?: ts.Node
  ) {
    if (!node) {
      return;
    }
    const rawComment = getRawComment(node);
    if (!rawComment) {
      return;
    }

    if (
      reflection.kindOf(ReflectionKind.FunctionOrMethod) ||
      (reflection.kindOf(ReflectionKind.Event) && reflection["signatures"])
    ) {
      const comment = parseComment(rawComment, reflection.comment);
      this.applyModifiers(reflection, comment);
      this.removeExcludedTags(comment);
    } else if (reflection.kindOf(ReflectionKind.Namespace)) {
      this.storeModuleComment(rawComment, reflection);
    } else {
      const comment = parseComment(rawComment, reflection.comment);
      this.applyModifiers(reflection, comment);
      this.removeExcludedTags(comment);
      reflection.comment = comment;
    }
  }

  /**
   * Triggered when the converter has found a function implementation.
   *
   * @param context  The context object describing the current state the converter is in.
   * @param reflection  The reflection that is currently processed.
   * @param node  The node that is currently processed if available.
   */
  private onFunctionImplementation(
    context: Context,
    reflection: Reflection,
    node?: ts.Node
  ) {
    if (!node) {
      return;
    }

    const comment = getRawComment(node);
    if (comment) {
      reflection.comment = parseComment(comment, reflection.comment);
    }
  }

  /**
   * Triggered when the converter begins resolving a project.
   *
   * @param context  The context object describing the current state the converter is in.
   */
  private onBeginResolve(context: Context) {
    for (const id in this.comments) {
      if (!this.comments.hasOwnProperty(id)) {
        continue;
      }

      const info = this.comments[id];
      const comment = parseComment(info.fullText);
      comment.removeTags("preferred");

      this.applyModifiers(info.reflection, comment);
      info.reflection.comment = comment;
    }

    const stripInternal = !!this.application.options.getCompilerOptions()
      .stripInternal;
    const excludePrivate = this.application.options.getValue("excludePrivate");
    const excludeProtected = this.application.options.getValue(
      "excludeProtected"
    );

    const project = context.project;
    const reflections = Object.values(project.reflections);

    // remove signatures
    // TODO: This doesn't really belong here. Removing comments due to @hidden yes, but private/protected no.
    //   it needs to be here for now because users can use @public/@private/@protected to override visibility.
    //   the converter should probably have a post resolve step in which it handles the excludePrivate/protected options.
    const hidden = reflections.filter((reflection) =>
      CommentPlugin.isHidden(
        reflection,
        stripInternal,
        excludePrivate,
        excludeProtected
      )
    );
    hidden.forEach((reflection) => project.removeReflection(reflection, true));

    // remove functions with empty signatures after their signatures have been removed
    const [allRemoved, someRemoved] = partition(
      hidden
        .map((reflection) => reflection.parent!)
        .filter((method) =>
          method.kindOf(ReflectionKind.FunctionOrMethod)
        ) as DeclarationReflection[],
      (method) => method.signatures?.length === 0
    );
    allRemoved.forEach((reflection) =>
      project.removeReflection(reflection, true)
    );
    someRemoved.forEach((reflection) => {
      reflection.sources = uniq(
        reflection.signatures!.reduce<SourceReference[]>(
          (c, s) => c.concat(s.sources || []),
          []
        )
      );
    });
  }

  /**
   * Triggered when the converter resolves a reflection.
   *
   * Cleans up comment tags related to signatures like @param or @return
   * and moves their data to the corresponding parameter reflections.
   *
   * This hook also copies over the comment of function implementations to their
   * signatures.
   *
   * @param context  The context object describing the current state the converter is in.
   * @param reflection  The reflection that is currently resolved.
   */
  private onResolve(context: Context, reflection: DeclarationReflection) {
    if (!(reflection instanceof DeclarationReflection)) {
      return;
    }

    const signatures = reflection.getAllSignatures();
    if (signatures.length) {
      const comment = reflection.comment;
      if (comment && comment.hasTag("returns")) {
        comment.returns = comment.getTag("returns")!.text;
        comment.removeTags("returns");
      }

      signatures.forEach((signature) => {
        let childComment = signature.comment;
        if (childComment && childComment.hasTag("returns")) {
          childComment.returns = childComment.getTag("returns")!.text;
          childComment.removeTags("returns");
        }

        if (comment) {
          if (!childComment) {
            childComment = signature.comment = new Comment();
          }

          childComment.shortText = childComment.shortText || comment.shortText;
          childComment.text = childComment.text || comment.text;
          childComment.returns = childComment.returns || comment.returns;
          childComment.tags = childComment.tags || comment.tags;
        }

        if (signature.parameters) {
          signature.parameters.forEach((parameter) => {
            let tag: CommentTag | undefined;
            if (childComment) {
              tag = childComment.getTag("param", parameter.name);
            }
            if (comment && !tag) {
              tag = comment.getTag("param", parameter.name);
            }
            if (tag) {
              parameter.comment = new Comment(tag.text);
            }
          });
        }

        childComment?.removeTags("param");
      });

      comment?.removeTags("param");
    }
  }

  private removeExcludedTags(comment: Comment) {
    for (const tag of TAG_BLACKLIST) {
      comment.removeTags(tag);
    }
    for (const tag of this.excludeTags) {
      comment.removeTags(tag);
    }
  }

  /**
   * Determines whether or not a reflection has been hidden
   *
   * @param reflection Reflection to check if hidden
   */
  private static isHidden(
    reflection: Reflection,
    stripInternal: boolean,
    excludePrivate: boolean,
    excludeProtected: boolean
  ) {
    const comment = reflection.comment;

    if (reflection.flags.hasFlag(ReflectionFlag.Private) && excludePrivate) {
      return true;
    }

    if (
      reflection.flags.hasFlag(ReflectionFlag.Protected) &&
      excludeProtected
    ) {
      return true;
    }

    if (!comment) {
      return false;
    }

    return (
      comment.hasTag("hidden") ||
      comment.hasTag("ignore") ||
      (comment.hasTag("internal") && stripInternal)
    );
  }
}
