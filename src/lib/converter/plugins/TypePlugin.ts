import { Reflection, ReflectionKind, Decorator, DeclarationReflection, DeclarationHierarchy } from '../../models/reflections/index';
import { Type, ReferenceType, TupleType, UnionType, IntersectionType, ArrayType, TypeOperatorType, QueryType } from '../../models/types/index';
import { Component, ConverterComponent } from '../components';
import { Converter } from '../converter';
import { Context } from '../context';

/**
 * A handler that converts all instances of [[LateResolvingType]] to their renderable equivalents.
 */
@Component({name: 'type'})
export class TypePlugin extends ConverterComponent {
    reflections: DeclarationReflection[] = [];

    /**
     * Create a new TypeHandler instance.
     */
    initialize() {
        // this.listenTo(this.owner, {
        //     [Converter.EVENT_RESOLVE]:     this.onResolve,
        //     [Converter.EVENT_RESOLVE_END]: this.onResolveEnd
        // });
    }

    /**
     * Triggered when the converter resolves a reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently resolved.
     */
    private onResolve(context: Context, reflection: DeclarationReflection) {
        const project = context.project;

        resolveType(reflection, <ReferenceType> reflection.type);
        resolveType(reflection, <ReferenceType> reflection.inheritedFrom);
        resolveType(reflection, <ReferenceType> reflection.overwrites);
        resolveTypes(reflection, reflection.extendedTypes);
        resolveTypes(reflection, reflection.extendedBy);
        resolveTypes(reflection, reflection.implementedTypes);

        if (reflection.decorators) {
            reflection.decorators.forEach((decorator: Decorator) => {
                if (decorator.type) {
                    resolveType(reflection, decorator.type);
                }
            });
        }

        if (reflection.kindOf(ReflectionKind.ClassOrInterface)) {
            this.postpone(reflection);

            walk(reflection.implementedTypes, (target) => {
                this.postpone(target);
                if (!target.implementedBy) {
                    target.implementedBy = [];
                }
                target.implementedBy.push(new ReferenceType(reflection.name, ReferenceType.SYMBOL_FQN_RESOLVED, reflection));
            });

            walk(reflection.extendedTypes, (target) => {
                this.postpone(target);
                if (!target.extendedBy) {
                    target.extendedBy = [];
                }
                target.extendedBy.push(new ReferenceType(reflection.name, ReferenceType.SYMBOL_FQN_RESOLVED, reflection));
            });
        }

        function walk(types: Type[] | undefined, callback: {(declaration: DeclarationReflection): void}) {
            if (!types) {
                return;
            }
            types.forEach(type => {
                if (!(type instanceof ReferenceType)) {
                    return;
                }
                if (!type.reflection || !(type.reflection instanceof DeclarationReflection)) {
                    return;
                }
                callback(type.reflection);
            });
        }

        function resolveTypes(reflection: Reflection, types?: Type[]) {
            if (!types) {
                return;
            }
            for (let i = 0, c = types.length; i < c; i++) {
                resolveType(reflection, <ReferenceType> types[i]);
            }
        }

        function resolveType(reflection: Reflection, type: Type) {
            if (type instanceof ReferenceType) {
                if (type.symbolFullyQualifiedName === ReferenceType.SYMBOL_FQN_RESOLVE_BY_NAME) {
                    type.reflection = reflection.findReflectionByName(type.name);
                } else if (!type.reflection && type.symbolFullyQualifiedName !== ReferenceType.SYMBOL_FQN_RESOLVED) {
                    type.reflection = project.getReflectionFromFQN(type.symbolFullyQualifiedName);
                }

                if (type.typeArguments) {
                    resolveTypes(reflection, type.typeArguments);
                }
            } else if (type instanceof TupleType) {
                resolveTypes(reflection, type.elements);
            } else if (type instanceof UnionType || type instanceof IntersectionType) {
                resolveTypes(reflection, type.types);
            } else if (type instanceof ArrayType) {
                resolveType(reflection, type.elementType);
            } else if (type instanceof TypeOperatorType) {
                resolveType(reflection, type.target);
            } else if (type instanceof QueryType) {
                resolveType(reflection, type.queryType);
            }
        }
    }

    private postpone(reflection: DeclarationReflection) {
        if (!this.reflections.includes(reflection)) {
            this.reflections.push(reflection);
        }
    }

    /**
     * Triggered when the converter has finished resolving a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onResolveEnd(context: Context) {
        this.reflections.forEach((reflection) => {
            if (reflection.implementedBy) {
                reflection.implementedBy.sort((a: Type, b: Type): number => {
                    if (a['name'] === b['name']) {
                        return 0;
                    }
                    return a['name'] > b['name'] ? 1 : -1;
                });
            }

            let root!: DeclarationHierarchy;
            let hierarchy!: DeclarationHierarchy;
            function push(types: Type[]) {
                const level: DeclarationHierarchy = {types: types};
                if (hierarchy) {
                    hierarchy.next = level;
                    hierarchy = level;
                } else {
                    root = hierarchy = level;
                }
            }

            if (reflection.extendedTypes) {
                push(reflection.extendedTypes);
            }

            push([new ReferenceType(reflection.name, ReferenceType.SYMBOL_FQN_RESOLVED, reflection)]);
            hierarchy.isTarget = true;

            if (reflection.extendedBy) {
                push(reflection.extendedBy);
            }

            reflection.typeHierarchy = root;
        });
    }
}
