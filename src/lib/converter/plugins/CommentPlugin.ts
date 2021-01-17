import * as ts from "typescript";

import { Comment, CommentTag } from "../../models/comments/index";
import {
    Reflection,
    ReflectionFlag,
    ReflectionKind,
    TypeParameterReflection,
    DeclarationReflection,
} from "../../models/reflections/index";
import { Component, ConverterComponent } from "../components";
import { parseComment, getRawComment } from "../factories/comment";
import { Converter } from "../converter";
import type { Context } from "../context";
import type { SourceReference } from "../../models";
import { BindOption, removeIfPresent } from "../../utils";
import { partition, unique } from "../../utils/array";

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
 * A handler that parses TypeDoc comments and attaches [[Comment]] instances to
 * the generated reflections.
 */
@Component({ name: "comment" })
export class CommentPlugin extends ConverterComponent {
    @BindOption("excludeTags")
    excludeTags!: string[];

    /**
     * Create a new CommentPlugin instance.
     */
    initialize() {
        this.listenTo(this.owner, {
            [Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
            [Converter.EVENT_CREATE_SIGNATURE]: this.onDeclaration,
            [Converter.EVENT_CREATE_TYPE_PARAMETER]: this.onCreateTypeParameter,
            [Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
            [Converter.EVENT_RESOLVE]: this.onResolve,
        });
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
            if (reflection.kindOf(ReflectionKind.CallSignature)) {
                reflection.parent?.setFlag(ReflectionFlag.Private);
            }
            comment.removeTags("private");
        }

        if (comment.hasTag("protected")) {
            reflection.setFlag(ReflectionFlag.Protected);
            if (reflection.kindOf(ReflectionKind.CallSignature)) {
                reflection.parent?.setFlag(ReflectionFlag.Protected);
            }
            comment.removeTags("protected");
        }

        if (comment.hasTag("public")) {
            reflection.setFlag(ReflectionFlag.Public);
            if (reflection.kindOf(ReflectionKind.CallSignature)) {
                reflection.parent?.setFlag(ReflectionFlag.Public);
            }
            comment.removeTags("public");
        }

        if (comment.hasTag("event")) {
            if (reflection.kindOf(ReflectionKind.CallSignature)) {
                if (reflection.parent) {
                    reflection.parent.kind = ReflectionKind.Event;
                }
            }
            reflection.kind = ReflectionKind.Event;
            comment.removeTags("event");
        }

        if (
            reflection.kindOf(
                ReflectionKind.Module |
                    ReflectionKind.Namespace |
                    ReflectionKind.Project
            )
        ) {
            comment.removeTags("packagedocumentation");
        }
    }

    /**
     * Triggered when the converter has created a type parameter reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently processed.
     */
    private onCreateTypeParameter(
        _context: Context,
        reflection: TypeParameterReflection,
        node?: ts.Node
    ) {
        if (node && ts.isJSDocTemplateTag(node.parent)) {
            if (node.parent.comment) {
                reflection.comment = new Comment(node.parent.comment);
            }
        }

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
                removeIfPresent(comment.tags, tag);
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
        _context: Context,
        reflection: Reflection,
        node?: ts.Node
    ) {
        if (!node) {
            return;
        }
        if (reflection.kindOf(ReflectionKind.FunctionOrMethod)) {
            return;
        }
        const rawComment = getRawComment(node);
        if (!rawComment) {
            return;
        }

        const comment = parseComment(rawComment, reflection.comment);
        this.applyModifiers(reflection, comment);
        this.removeExcludedTags(comment);
        reflection.comment = comment;

        if (reflection.kindOf(ReflectionKind.Module)) {
            const tag = reflection.comment?.getTag("module");
            if (tag) {
                reflection.name = tag.text.trim();
                removeIfPresent(reflection.comment?.tags, tag);
            }
        }
    }

    /**
     * Triggered when the converter begins resolving a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onBeginResolve(context: Context) {
        const excludeInternal = this.application.options.getValue(
            "excludeInternal"
        );
        const excludePrivate = this.application.options.getValue(
            "excludePrivate"
        );
        const excludeProtected = this.application.options.getValue(
            "excludeProtected"
        );

        const project = context.project;
        const reflections = Object.values(project.reflections);

        // Remove hidden reflections
        const hidden = reflections.filter((reflection) =>
            CommentPlugin.isHidden(
                reflection,
                excludeInternal,
                excludePrivate,
                excludeProtected
            )
        );
        hidden.forEach((reflection) => project.removeReflection(reflection));

        // remove functions with empty signatures after their signatures have been removed
        const [allRemoved, someRemoved] = partition(
            hidden
                .map((reflection) => reflection.parent!)
                .filter((method) =>
                    method.kindOf(
                        ReflectionKind.FunctionOrMethod |
                            ReflectionKind.Constructor
                    )
                ) as DeclarationReflection[],
            (method) => method.signatures?.length === 0
        );
        allRemoved.forEach((reflection) =>
            project.removeReflection(reflection)
        );
        someRemoved.forEach((reflection) => {
            reflection.sources = unique(
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
    private onResolve(_context: Context, reflection: DeclarationReflection) {
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

                    childComment.shortText =
                        childComment.shortText || comment.shortText;
                    childComment.text = childComment.text || comment.text;
                    childComment.returns =
                        childComment.returns || comment.returns;
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
        excludeInternal: boolean,
        excludePrivate: boolean,
        excludeProtected: boolean
    ) {
        const comment = reflection.comment;

        if (
            reflection.flags.hasFlag(ReflectionFlag.Private) &&
            excludePrivate
        ) {
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
            (comment.hasTag("internal") && excludeInternal)
        );
    }
}
