import { ReflectionKind, SomeReflection } from '../models'
import type { Application } from '../application'

/**
 * Define the sort order of reflections.
 */
const WEIGHTS = [
    ReflectionKind.Project,
    ReflectionKind.Module,
    ReflectionKind.Namespace,
    ReflectionKind.Enum,
    ReflectionKind.EnumMember,
    ReflectionKind.Class,
    ReflectionKind.Interface,
    ReflectionKind.Alias,

    ReflectionKind.Property,
    ReflectionKind.Variable,
    ReflectionKind.Function,
    ReflectionKind.Accessor,
    ReflectionKind.Method,
    ReflectionKind.Object,

    ReflectionKind.Parameter
];

// TODO: Sort order option
const sorters: Record<string, (a: SomeReflection, b: SomeReflection) => number> = {
    default(a, b) {
        const aWeight = WEIGHTS.indexOf(a.kind);
        const bWeight = WEIGHTS.indexOf(b.kind);
        if (aWeight !== bWeight) {
            return aWeight - bWeight;
        }

        // TODO: Static properties first.
        // if (a.flags.isStatic && !b.flags.isStatic) {
        //     return 1;
        // }

        // if (!a.flags.isStatic && b.flags.isStatic) {
        //     return -1;
        // }

        return a.name.localeCompare(b.name);
    }
}

// Plugin which sorts reflections for display.
export function load(app: Application) {
    app.converter.on('end', project => {
        const toVisit: SomeReflection[] = [project];

        while (toVisit.length) {
            const item = toVisit.pop()!;
            if (item.isContainer()) {
                toVisit.push(...item.children);
                item.children.sort(sorters.default);
            }
        }
    })
}
