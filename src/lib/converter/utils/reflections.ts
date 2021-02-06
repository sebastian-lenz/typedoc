import {
    Comment,
    DeclarationReflection,
    IntrinsicType,
    Reflection,
    SignatureReflection,
    Type,
    UnionType,
} from "../../models";

export function removeUndefined(type: Type) {
    if (type instanceof UnionType) {
        const types = type.types.filter(
            (t) => !t.equals(new IntrinsicType("undefined"))
        );
        if (types.length === 1) {
            return types[0];
        }
        type.types = types;
        return type;
    }
    return type;
}

/**
 * Copy the comment of the source reflection to the target reflection.
 *
 * @param target - Reflection with comment containing `inheritdoc` tag
 * @param source - Referenced reflection
 */
export function copyComment(target: Reflection, source: Reflection) {
    if (
        target.comment &&
        source.comment &&
        target.comment.hasTag("inheritdoc")
    ) {
        if (
            target instanceof DeclarationReflection &&
            source instanceof DeclarationReflection
        ) {
            target.typeParameters = source.typeParameters;
        }
        if (
            target instanceof SignatureReflection &&
            source instanceof SignatureReflection
        ) {
            target.typeParameters = source.typeParameters;
            /**
             * TSDoc overrides existing parameters entirely with inherited ones, while
             * existing implementation merges them.
             * To avoid breaking things, `inheritDoc` tag is additionally checked for the parameter,
             * so the previous behavior will continue to work.
             *
             * TODO: When breaking change becomes acceptable remove legacy implementation
             */
            if (target.comment.getTag("inheritdoc")?.paramName) {
                target.parameters = source.parameters;
            } else {
                legacyCopyImplementation(target, source);
            }
        }
        target.comment.removeTags("inheritdoc");
        target.comment.copyFrom(source.comment);
    } else if (!target.comment && source.comment) {
        if (
            target instanceof DeclarationReflection &&
            source instanceof DeclarationReflection
        ) {
            target.typeParameters = source.typeParameters;
        }
        target.comment = new Comment();
        target.comment.copyFrom(source.comment);
    }
}

/**
 * Copy comments from source reflection to target reflection, parameters are merged.
 *
 * @param target - Reflection with comment containing `inheritdoc` tag
 * @param source - Parent reflection
 */
function legacyCopyImplementation(
    target: SignatureReflection,
    source: SignatureReflection
) {
    if (target.parameters && source.parameters) {
        for (
            let index = 0, count = target.parameters.length;
            index < count;
            index++
        ) {
            const sourceParameter = source.parameters[index];
            if (sourceParameter && sourceParameter.comment) {
                const targetParameter = target.parameters[index];
                if (!targetParameter.comment) {
                    targetParameter.comment = new Comment();
                    targetParameter.comment.copyFrom(sourceParameter.comment);
                }
            }
        }
    }
}
