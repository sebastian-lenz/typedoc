import {
    Reflection,
    ReflectionKind,
    TraverseCallback,
    TraverseProperty,
} from "./abstract";
import type { ReflectionCategory } from "../ReflectionCategory";
import type { ReflectionGroup } from "../ReflectionGroup";
import type { DeclarationReflection } from "./declaration";

export class ContainerReflection extends Reflection {
    /**
     * The children of this reflection.
     */
    children?: DeclarationReflection[];

    /**
     * All children grouped by their kind.
     */
    groups?: ReflectionGroup[];

    /**
     * All children grouped by their category.
     */
    categories?: ReflectionCategory[];

    /**
     * Return a list of all children of a certain kind.
     *
     * @param kind  The desired kind of children.
     * @returns     An array containing all children with the desired kind.
     */
    getChildrenByKind(kind: ReflectionKind): DeclarationReflection[] {
        return (this.children || []).filter((child) => child.kindOf(kind));
    }

    /**
     * Traverse all potential child reflections of this reflection.
     *
     * The given callback will be invoked for all children, signatures and type parameters
     * attached to this reflection.
     *
     * @param callback  The callback function that should be applied for each child reflection.
     */
    traverse(callback: TraverseCallback) {
        for (const child of this.children ?? []) {
            if (callback(child, TraverseProperty.Children) === false) {
                return;
            }
        }
    }
}
