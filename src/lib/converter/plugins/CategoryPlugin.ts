import { Reflection, ContainerReflection, ReflectionGroup, IndependentReflection } from '../../models';
import { ReflectionCategory } from '../../models/ReflectionCategory';
import { Component, ConverterComponent } from '../components';
import { Converter } from '../converter';
import { Context } from '../context';
import { BindOption } from '../../utils';
import { Comment } from '../../models/comments/index';

declare module '../../models/reflections/abstract' {
    export interface ContainerReflection<Child extends IndependentReflection> {
        /**
         * All children grouped by their kind.
         */
        groups?: ReflectionGroup[];

        /**
         * All children grouped by their category.
         */
        categories?: ReflectionCategory[];
    }
}

/**
 * A handler that sorts and categorizes the found reflections in the resolving phase.
 *
 * The handler sets the ´category´ property of all reflections.
 */
@Component({name: 'category'})
export class CategoryPlugin extends ConverterComponent {
    @BindOption('defaultCategory')
    defaultCategory!: string;

    @BindOption('categoryOrder')
    categoryOrder!: string[];

    @BindOption('categorizeByGroup')
    categorizeByGroup!: boolean;

    // For use in static methods
    static defaultCategory = 'Other';
    static WEIGHTS: string[] = [];

    /**
     * Create a new CategoryPlugin instance.
     */
    initialize() {
        // this.listenTo(this.owner, {
        //     [Converter.EVENT_BEGIN]:       this.onBegin,
        //     [Converter.EVENT_RESOLVE]:     this.onResolve,
        //     [Converter.EVENT_RESOLVE_END]: this.onEndResolve
        // }, undefined, -200);
    }

    /**
     * Triggered when the converter begins converting a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onBegin(context: Context) {
        // Set up static properties
        if (this.defaultCategory) {
            CategoryPlugin.defaultCategory = this.defaultCategory;
        }
        if (this.categoryOrder) {
            CategoryPlugin.WEIGHTS = this.categoryOrder;
        }
    }

    /**
     * Triggered when the converter resolves a reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently resolved.
     */
    private onResolve(context: Context, reflection: Reflection) {
        if (reflection instanceof ContainerReflection) {
            this.categorize(reflection);
        }
    }

    /**
     * Triggered when the converter has finished resolving a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onEndResolve(context: Context) {
        const project = context.project;
        this.categorize(project);
    }

    private categorize(obj: ContainerReflection) {
        if (this.categorizeByGroup) {
            this.groupCategorize(obj);
        } else {
            this.lumpCategorize(obj);
        }
    }

    private groupCategorize(obj: ContainerReflection) {
        if (!obj.groups || obj.groups.length === 0) {
            return;
        }
        obj.groups.forEach((group) => {
            group.categories = CategoryPlugin.getReflectionCategories(group.children);
            if (group.categories && group.categories.length > 1) {
                group.categories.sort(CategoryPlugin.sortCatCallback);
            } else if (group.categories.length === 1 && group.categories[0].title === CategoryPlugin.defaultCategory) {
                // no categories if everything is uncategorized
                group.categories = undefined;
            }
        });
    }

    private lumpCategorize(obj: ContainerReflection) {
        if (!obj.children || obj.children.length === 0) {
            return;
        }
        obj.categories = CategoryPlugin.getReflectionCategories(obj.children);
        if (obj.categories && obj.categories.length > 1) {
            obj.categories.sort(CategoryPlugin.sortCatCallback);
        } else if (obj.categories.length === 1 && obj.categories[0].title === CategoryPlugin.defaultCategory) {
            // no categories if everything is uncategorized
            obj.categories = undefined;
        }
    }

    /**
     * Create a categorized representation of the given list of reflections.
     *
     * @param reflections  The reflections that should be categorized.
     * @returns An array containing all children of the given reflection categorized
     */
    static getReflectionCategories(reflections: Reflection[]): ReflectionCategory[] {
        const categories: ReflectionCategory[] = [];
        let defaultCat: ReflectionCategory | undefined;
        reflections.forEach((child) => {
            const childCat = CategoryPlugin.getCategory(child);
            if (childCat === '') {
                if (!defaultCat) {
                    defaultCat = categories.find(category => category.title === CategoryPlugin.defaultCategory);
                    if (!defaultCat) {
                        defaultCat = new ReflectionCategory(CategoryPlugin.defaultCategory);
                        categories.push(defaultCat);
                    }
                }
                defaultCat.children.push(child);
                return;
            }
            let category = categories.find(cat => cat.title === childCat);
            if (category) {
                category.children.push(child);
                return;
            }
            category = new ReflectionCategory(childCat);
            category.children.push(child);
            categories.push(category);
        });
        return categories;
    }

    /**
     * Return the category of a given reflection.
     *
     * @param reflection The reflection.
     * @returns The category the reflection belongs to
     */
    static getCategory(reflection: Reflection): string {
        function extractCategoryTag(comment: Comment) {
            const tags = comment.tags;
            if (tags) {
                const tagIndex = tags.findIndex(tag => tag.tagName === 'category');
                if (tagIndex >= 0) {
                    const tag = tags[tagIndex].text;
                    tags.splice(tagIndex, 1);
                    return tag.trim();
                }
            }
            return '';
        }

        let category = '';
        if (reflection.comment) {
            category = extractCategoryTag(reflection.comment);
        } else if (reflection instanceof DeclarationReflection && reflection.signatures) {
            // If a reflection has signatures, use the first category tag amongst them
            reflection.signatures.forEach(sig => {
                if (sig.comment && category === '') {
                    category = extractCategoryTag(sig.comment);
                }
            });
        }
        return category;
    }

    /**
     * Callback used to sort categories by name.
     *
     * @param a The left reflection to sort.
     * @param b The right reflection to sort.
     * @returns The sorting weight.
     */
    static sortCatCallback(a: ReflectionCategory, b: ReflectionCategory): number {
        let aWeight = CategoryPlugin.WEIGHTS.indexOf(a.title);
        let bWeight = CategoryPlugin.WEIGHTS.indexOf(b.title);
        if (aWeight === -1 || bWeight === -1) {
            let asteriskIndex = CategoryPlugin.WEIGHTS.indexOf('*');
            if (asteriskIndex === -1) { asteriskIndex = CategoryPlugin.WEIGHTS.length; }
            if (aWeight === -1) { aWeight = asteriskIndex; }
            if (bWeight === -1) { bWeight = asteriskIndex; }
        }
        if (aWeight === bWeight) {
            return a.title > b.title ? 1 : -1;
        }
        return aWeight - bWeight;
    }
}
