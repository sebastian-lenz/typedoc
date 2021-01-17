import type { Reflection } from "../../models/reflections/abstract";

/**
 * A hierarchical model holding the data of single node within the navigation.
 *
 * This structure is used by the [[NavigationPlugin]] and [[TocPlugin]] to expose the current
 * navigation state to the template engine. Themes should generate the primary navigation structure
 * through the [[BaseTheme.getNavigation]] method.
 */
export class NavigationItem {
    /**
     * The visible title of the navigation node.
     */
    title: string;

    /**
     * The url this navigation node points to.
     */
    url: string;

    /**
     * A list of urls that should be seen as sub-pages of this node.
     */
    dedicatedUrls?: string[];

    /**
     * The parent navigation node.
     */
    parent?: NavigationItem;

    /**
     * An array containing all child navigation nodes.
     */
    children?: NavigationItem[];

    /**
     * A string containing the css classes of this node.
     */
    cssClasses: string;

    /**
     * Is this item a simple label without a link?
     */
    isLabel?: boolean;

    /**
     * Is this item visible?
     */
    isVisible?: boolean;

    /**
     * Does this navigation node represent the current page?
     */
    isCurrent?: boolean;

    /**
     * Is this the navigation node for the modules page?
     */
    isModules?: boolean;

    /**
     * Is this navigation node one of the parents of the current page?
     */
    isInPath?: boolean;

    /**
     * The source [Reflection] this item is built from
     */
    reflection?: Reflection;

    /**
     * Create a new NavigationItem instance.
     *
     * @param title       The visible title of the navigation node.
     * @param url         The url this navigation node points to.
     * @param parent      The parent navigation node.
     * @param cssClasses  A string containing the css classes of this node.
     * @param reflection  The source [Reflection] for this [NavigationItem]
     */
    constructor(
        title?: string,
        url?: string,
        parent?: NavigationItem,
        cssClasses?: string,
        reflection?: Reflection
    ) {
        this.title = title || "";
        this.url = url || "";
        this.parent = parent;
        this.cssClasses = cssClasses || "";
        this.reflection = reflection;

        if (!url) {
            this.isLabel = true;
        }

        if (this.parent) {
            if (!this.parent.children) {
                this.parent.children = [];
            }
            this.parent.children.push(this);
        }
    }

    /**
     * Create a navigation node for the given reflection.
     *
     * @param reflection     The reflection whose navigation node should be created.
     * @param parent         The parent navigation node.
     * @param useShortNames  Force this function to always use short names.
     */
    static create(
        reflection: Reflection,
        parent?: NavigationItem,
        useShortNames?: boolean
    ) {
        let name: string;
        if (useShortNames || (parent && parent.parent)) {
            name = reflection.name;
        } else {
            name = reflection.getFullName();
        }

        name = name.trim();
        if (name === "") {
            name = `<em>${reflection.kindString}</em>`;
        }

        return new NavigationItem(
            name,
            reflection.url,
            parent,
            reflection.cssClasses,
            reflection
        );
    }
}
