import { resolve } from "path";
import type { Application } from "../application";
import type { ProjectReflection } from "../models";
import { Renderer } from "../renderer";
import { Renderer as OldRenderer } from "./renderer";

export class HtmlRenderer implements Renderer {
    readonly name = "html";

    constructor(private app: Application) {}

    isEnabled(): boolean {
        return !this.app.options.isDefault("out");
    }

    async render(project: ProjectReflection) {
        const out = resolve(this.app.options.getValue("out") || "./docs");

        const renderer = new OldRenderer(this.app);

        await renderer.render(project, out);
    }
}
