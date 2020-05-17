import { Reflection } from './reflections/abstract';

/**
 * A category of reflections.
 *
 * Reflection categories are created by the {@link CategoryPlugin} in the resolving phase
 * of the dispatcher. The main purpose of categories is to be able to more easily
 * render human readable children lists in templates.
 */
export class ReflectionCategory {
    /**
     * The title, a string representation of this category.
     */
    title: string;

    /**
     * All reflections of this category.
     */
    children: Reflection[] = [];

    /**
     * Do all children of this category have a separate document?
     *
     * @privateRemarks
     * This isn't a standard class method because Handlebars might not call it with the
     * correct `this` binding.
     * TODO: This ought not live here. Models shouldn't know how they are rendered.
     */
    allChildrenHaveOwnDocument = () => this.children.every(child => child.hasOwnDocument);

    /**
     * Create a new ReflectionCategory instance.
     *
     * @param title The title of this category.
     */
    constructor(title: string) {
        this.title = title;
    }
}
