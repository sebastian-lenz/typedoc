import {
    ReflectionKind,
    DeclarationReflection,
    SignatureReflection,
} from "../../models/reflections/index";
import { Type, ReferenceType } from "../../models/types/index";
import { Component, ConverterComponent } from "../components";
import { Converter } from "../converter";
import type { Context } from "../context";
import { zip } from "../../utils/array";
import { copyComment } from "../utils/reflections";

/**
 * A plugin that detects interface implementations of functions and
 * properties on classes and links them.
 */
@Component({ name: "implements" })
export class ImplementsPlugin extends ConverterComponent {
    /**
     * Create a new ImplementsPlugin instance.
     */
    initialize() {
        this.listenTo(this.owner, Converter.EVENT_RESOLVE, this.onResolve, -10);
    }

    /**
     * Mark all members of the given class to be the implementation of the matching interface member.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param classReflection  The reflection of the classReflection class.
     * @param interfaceReflection  The reflection of the interfaceReflection interface.
     */
    private analyzeClass(
        context: Context,
        classReflection: DeclarationReflection,
        interfaceReflection: DeclarationReflection
    ) {
        if (!interfaceReflection.children) {
            return;
        }

        interfaceReflection.children.forEach(
            (interfaceMember: DeclarationReflection) => {
                if (!(interfaceMember instanceof DeclarationReflection)) {
                    return;
                }

                let classMember: DeclarationReflection | undefined;

                if (!classReflection.children) {
                    return;
                }

                for (
                    let index = 0, count = classReflection.children.length;
                    index < count;
                    index++
                ) {
                    const child = classReflection.children[index];
                    if (child.name !== interfaceMember.name) {
                        continue;
                    }
                    if (
                        child.flags.isStatic !== interfaceMember.flags.isStatic
                    ) {
                        continue;
                    }

                    classMember = child;
                    break;
                }

                if (!classMember) {
                    return;
                }

                const interfaceMemberName =
                    interfaceReflection.name + "." + interfaceMember.name;
                classMember.implementationOf = new ReferenceType(
                    interfaceMemberName,
                    interfaceMember,
                    context.project
                );
                copyComment(classMember, interfaceMember);

                if (
                    interfaceMember.kindOf(ReflectionKind.FunctionOrMethod) &&
                    interfaceMember.signatures &&
                    classMember.signatures
                ) {
                    interfaceMember.signatures.forEach(
                        (interfaceSignature: SignatureReflection) => {
                            const interfaceParameters = interfaceSignature.getParameterTypes();
                            (classMember!.signatures || []).forEach(
                                (classSignature: SignatureReflection) => {
                                    if (
                                        Type.isTypeListEqual(
                                            interfaceParameters,
                                            classSignature.getParameterTypes()
                                        )
                                    ) {
                                        classSignature.implementationOf = new ReferenceType(
                                            interfaceMemberName,
                                            interfaceSignature,
                                            context.project
                                        );
                                        copyComment(
                                            classSignature,
                                            interfaceSignature
                                        );
                                    }
                                }
                            );
                        }
                    );
                }
            }
        );
    }

    private analyzeInheritance(
        context: Context,
        reflection: DeclarationReflection
    ) {
        const extendedTypes = (reflection.extendedTypes?.filter((type) => {
            return (
                type instanceof ReferenceType &&
                type.reflection instanceof DeclarationReflection
            );
        }) ?? []) as Array<
            ReferenceType & { reflection: DeclarationReflection }
        >;

        for (const parent of extendedTypes) {
            for (const parentMember of parent.reflection.children ?? []) {
                const child = reflection.children?.find(
                    (child) =>
                        child.name == parentMember.name &&
                        child.flags.isStatic === parentMember.flags.isStatic
                );

                if (child) {
                    const key = child.getOverwrites()
                        ? "overwrites"
                        : "inheritedFrom";

                    for (const [childSig, parentSig] of zip(
                        child.signatures ?? [],
                        parentMember.signatures ?? []
                    )) {
                        childSig[key] = new ReferenceType(
                            `${parent.name}.${parentMember.name}`,
                            parentSig,
                            context.project
                        );
                    }

                    child[key] = new ReferenceType(
                        `${parent.name}.${parentMember.name}`,
                        parentMember,
                        context.project
                    );
                    copyComment(child, parentMember);
                }
            }
        }
    }

    /**
     * Triggered when the converter resolves a reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently resolved.
     */
    private onResolve(context: Context, reflection: DeclarationReflection) {
        if (
            reflection.kindOf(ReflectionKind.Class) &&
            reflection.implementedTypes
        ) {
            reflection.implementedTypes.forEach((type: Type) => {
                if (!(type instanceof ReferenceType)) {
                    return;
                }

                if (
                    type.reflection &&
                    type.reflection.kindOf(ReflectionKind.Interface)
                ) {
                    this.analyzeClass(
                        context,
                        reflection,
                        <DeclarationReflection>type.reflection
                    );
                }
            });
        }

        if (
            reflection.kindOf([
                ReflectionKind.Class,
                ReflectionKind.Interface,
            ]) &&
            reflection.extendedTypes
        ) {
            this.analyzeInheritance(context, reflection);
        }
    }
}
