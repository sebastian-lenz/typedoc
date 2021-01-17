import * as Path from "path";

import { Component, AbstractComponent } from "../utils/component";
import {
    ProjectReflection,
    DeclarationReflection,
} from "../models/reflections/index";
import type { Renderer } from "./renderer";
import { RendererEvent, PageEvent } from "./events";

export { Component };

export abstract class RendererComponent extends AbstractComponent<Renderer> {}

/**
 * A plugin for the renderer that reads the current render context.
 */
export abstract class ContextAwareRendererComponent extends RendererComponent {
    /**
     * The project that is currently processed.
     */
    protected project?: ProjectReflection;

    /**
     * The reflection that is currently processed.
     */
    protected reflection?: DeclarationReflection;

    /**
     * The url of the document that is being currently generated.
     * Set when a page begins rendering.
     */
    private location!: string;

    /**
     * Regular expression to test if a string looks like an external url.
     */
    protected urlPrefix = /^(http|ftp)s?:\/\//;

    /**
     * Create a new ContextAwareRendererPlugin instance.
     *
     * @param renderer  The renderer this plugin should be attached to.
     */
    protected initialize() {
        this.listenTo(this.owner, {
            [RendererEvent.BEGIN]: this.onBeginRenderer,
            [PageEvent.BEGIN]: this.onBeginPage,
        });
    }

    /**
     * Transform the given absolute path into a relative path.
     *
     * @param absolute  The absolute path to transform.
     * @returns A path relative to the document currently processed.
     */
    public getRelativeUrl(absolute: string): string {
        if (this.urlPrefix.test(absolute)) {
            return absolute;
        } else {
            const relative = Path.relative(
                Path.dirname(this.location),
                Path.dirname(absolute)
            );
            return Path.join(relative, Path.basename(absolute)).replace(
                /\\/g,
                "/"
            );
        }
    }

    /**
     * Triggered before the renderer starts rendering a project.
     *
     * @param event  An event object describing the current render operation.
     */
    protected onBeginRenderer(event: RendererEvent) {
        this.project = event.project;
    }

    /**
     * Triggered before a document will be rendered.
     *
     * @param page  An event object describing the current render operation.
     */
    protected onBeginPage(page: PageEvent) {
        this.location = page.url;
        this.reflection =
            page.model instanceof DeclarationReflection
                ? page.model
                : undefined;
    }
}
