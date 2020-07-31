import type { Application } from "../../application";
import {
  ReflectionKind,
  PropertyReflection,
  MethodReflection,
  Visibility,
  SomeReflection,
} from "../../models";
import type { AccessorReflection } from "../../models/reflections/property";

// TODO: @event

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

export function load(app: Application): void {
  app.converter.on("reflectionCreated", (reflection) => {
    if (
      isHidden(
        reflection,
        Boolean(app.options.getCompilerOptions().stripInternal)
      )
    ) {
      reflection.project?.removeReflection(reflection);
      return;
    }

    reflection.comment?.removeTags(
      ...TAG_BLACKLIST,
      ...app.options.getValue("excludeTags")
    );

    if (
      reflection.kindOf(
        ReflectionKind.Property,
        ReflectionKind.Accessor,
        ReflectionKind.Method
      )
    ) {
      applyVisibilityModifiers(reflection);
    }

    if (reflection.kindOf(ReflectionKind.Module)) {
      reflection.comment?.removeTags("packageDocumentation");
    }
  });
}

function applyVisibilityModifiers(
  reflection: PropertyReflection | AccessorReflection | MethodReflection
) {
  const comment = reflection.comment;
  if (!comment) return;

  if (comment.hasTag("private")) {
    reflection.visibility = Visibility.Private;
  }
  if (comment.hasTag("protected")) {
    reflection.visibility = Visibility.Protected;
  }
  if (comment.hasTag("public")) {
    reflection.visibility = Visibility.Public;
  }

  comment.removeTags("private", "protected", "public");
}

function isHidden(reflection: SomeReflection, stripInternal: boolean) {
  if (!reflection.comment) {
    return false;
  }

  return (
    reflection.comment.hasTag("hidden") ||
    reflection.comment.hasTag("ignore") ||
    (stripInternal && reflection.comment.hasTag("internal"))
  );
}
