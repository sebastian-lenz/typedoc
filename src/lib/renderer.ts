import { ok } from "assert";
import type { Application } from "./application";
import type { ProjectReflection } from "./models";
import type { NeverIfInternal } from "./utils";
import { HtmlRenderer } from "./output/html";
import { Serializer } from "./json";

/**
 * Handles generating output.
 */
export class RendererContainer {
    private defaultRenderer: Renderer;
    private renderers = new Map<string, Renderer>();

    constructor(private app: Application) {
        this.defaultRenderer = new HtmlRenderer(app);
        this.addRenderer(this.defaultRenderer);
        this.addRenderer(new Serializer(app));
    }

    addRenderer(renderer: Renderer) {
        ok(
            !this.renderers.has(renderer.name),
            `Renderer names must be unique, duplicate: ${renderer.name}`
        );
        this.renderers.set(renderer.name, renderer);
    }

    getRenderer<K extends keyof RendererMap>(name: K): RendererMap[K];
    getRenderer(name: NeverIfInternal<string>): Renderer | undefined;
    getRenderer(name: string) {
        return this.renderers.get(name);
    }

    setDefault(renderer: Renderer) {
        ok(
            this.renderers.get(renderer.name) === renderer,
            "A renderer can only be set as the default if it has been added to the container"
        );
        this.defaultRenderer = renderer;
    }

    async render(project: ProjectReflection) {
        const enabled = [...this.renderers.values()].filter((renderer) =>
            renderer.isEnabled()
        );

        // If no renderers are explicitly enabled, just render the default output.
        if (enabled.length === 0) {
            enabled.push(this.defaultRenderer);
        }

        await Promise.all(
            enabled.map((gen) =>
                gen.render(project).catch((error) => {
                    this.app.logger.error(error.message);
                })
            )
        );
    }
}

/**
 * Generic renderer interface for output creation to implement.
 */
export interface Renderer {
    /**
     * Should be unique. TypeDoc uses `html` and `json`.
     */
    readonly name: string;

    /**
     * Should return true if the user set the option for this renderer's output file/dir.
     */
    isEnabled(): boolean;

    /**
     * Generate a document, errors thrown will be caught and reported to the user.
     * @param project should be considered immutable
     */
    render(project: ProjectReflection): Promise<void>;
}

/**
 * A map of renderer names to instance types which makes type checking simpler.
 *
 * May be added to by plugins which add a renderer:
 * ```ts
 * declare module "typedoc" {
 *   export interface RendererMap {
 *     markdown: MarkdownRenderer;
 *   }
 * }
 * ```
 */
export interface RendererMap {
    html: HtmlRenderer;
    json: Serializer;
}
