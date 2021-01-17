import {
    Reflection,
    SignatureReflection,
    ProjectReflection,
    TypeParameterReflection,
} from "../../models/reflections/index";
import { Comment, CommentTag } from "../../models/comments/index";
import { Component, ConverterComponent } from "../components";
import { Converter } from "../converter";
import type { Context } from "../context";
import { removeIfPresent } from "../../utils";

/**
 * A handler that moves comments with dot syntax to their target.
 */
@Component({ name: "deep-comment" })
export class DeepCommentPlugin extends ConverterComponent {
    /**
     * Create a new CommentHandler instance.
     */
    initialize() {
        this.listenTo(
            this.owner,
            Converter.EVENT_RESOLVE_BEGIN,
            this.onBeginResolve,
            512
        );
    }

    /**
     * Triggered when the converter begins resolving a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onBeginResolve(context: Context) {
        const project = context.project;
        let name: string;
        for (const key in project.reflections) {
            const reflection = project.reflections[key];
            if (!reflection.comment) {
                findDeepComment(reflection);
            }
        }

        function push(parent: Reflection) {
            let part = parent.originalName;
            if (
                !part ||
                part.substr(0, 2) === "__" ||
                parent instanceof SignatureReflection
            ) {
                part = "";
            }

            if (part && part !== "") {
                name = name === "" ? part : part + "." + name;
            }
        }

        function findDeepComment(reflection: Reflection) {
            name = "";
            push(reflection);
            let target = reflection.parent;

            while (target && !(target instanceof ProjectReflection)) {
                push(target);
                if (target.comment) {
                    let tag: CommentTag | undefined;
                    if (reflection instanceof TypeParameterReflection) {
                        tag = target.comment.getTag(
                            "typeparam",
                            reflection.name
                        );
                        if (!tag) {
                            tag = target.comment.getTag(
                                "template",
                                reflection.name
                            );
                        }
                        if (!tag) {
                            tag = target.comment.getTag(
                                "param",
                                "<" + reflection.name + ">"
                            );
                        }
                    }

                    if (!tag) {
                        tag = target.comment.getTag("param", name);
                    }

                    if (tag) {
                        removeIfPresent(target.comment.tags, tag);
                        reflection.comment = new Comment("", tag.text);
                        break;
                    }
                }

                target = target.parent;
            }
        }
    }
}
