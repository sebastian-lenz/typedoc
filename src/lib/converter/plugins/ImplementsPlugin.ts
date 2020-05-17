import { Reflection, ReflectionKind, DeclarationReflection, SignatureReflection } from '../../models/reflections/index';
import { Type, ReferenceType } from '../../models/types/index';
import { Component, ConverterComponent } from '../components';
import { Converter } from '../converter';
import { Context } from '../context';
import { Comment } from '../../models/comments/comment';

/**
 * A plugin that detects interface implementations of functions and
 * properties on classes and links them.
 */
@Component({name: 'implements'})
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
    private analyzeClass(context: Context, classReflection: DeclarationReflection, interfaceReflection: DeclarationReflection) {
        if (!interfaceReflection.children) {
            return;
        }

        interfaceReflection.children.forEach((interfaceMember: DeclarationReflection) => {
            if (!(interfaceMember instanceof DeclarationReflection)) {
                return;
            }

            let classMember: DeclarationReflection | undefined;

            if (!classReflection.children) {
                return;
            }

            for (let index = 0, count = classReflection.children.length; index < count; index++) {
                const child = classReflection.children[index];
                if (child.name !== interfaceMember.name) {
                    continue;
                }
                if (child.flags.isStatic !== interfaceMember.flags.isStatic) {
                    continue;
                }

                classMember = child;
                break;
            }

            if (!classMember) {
                return;
            }

            const interfaceMemberName = interfaceReflection.name + '.' + interfaceMember.name;
            classMember.implementationOf = new ReferenceType(interfaceMemberName, ReferenceType.SYMBOL_FQN_RESOLVED, interfaceMember);
            this.copyComment(classMember, interfaceMember);

            if (interfaceMember.kindOf(ReflectionKind.FunctionOrMethod) && interfaceMember.signatures && classMember.signatures) {
                interfaceMember.signatures.forEach((interfaceSignature: SignatureReflection) => {
                    const interfaceParameters = interfaceSignature.getParameterTypes();
                    (classMember!.signatures || []).forEach((classSignature: SignatureReflection) => {
                        if (Type.isTypeListEqual(interfaceParameters, classSignature.getParameterTypes())) {
                            classSignature.implementationOf = new ReferenceType(interfaceMemberName, ReferenceType.SYMBOL_FQN_RESOLVED, interfaceSignature);
                            this.copyComment(classSignature, interfaceSignature);
                        }
                    });
                });
            }
        });
    }

    /**
     * Copy the comment of the source reflection to the target reflection.
     *
     * @param target
     * @param source
     */
    private copyComment(target: Reflection, source: Reflection) {
        if (target.comment && source.comment && target.comment.hasTag('inheritdoc')) {
            target.comment.copyFrom(source.comment);

            if (target instanceof SignatureReflection && target.parameters &&
                source instanceof SignatureReflection && source.parameters) {
                for (let index = 0, count = target.parameters.length; index < count; index++) {
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
    }

    /**
     * Triggered when the converter resolves a reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently resolved.
     */
    private onResolve(context: Context, reflection: DeclarationReflection) {
        if (reflection.kindOf(ReflectionKind.Class) && reflection.implementedTypes) {
            reflection.implementedTypes.forEach((type: Type) => {
                if (!(type instanceof ReferenceType)) {
                    return;
                }

                if (type.reflection && type.reflection.kindOf(ReflectionKind.Interface)) {
                    this.analyzeClass(context, reflection, <DeclarationReflection> type.reflection);
                }
            });
        }
    }
}
