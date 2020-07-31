import { EventHooks } from "../utils/hooks";
import type { TemplateHooks } from "./templates";
import type { VNode } from "preact";
import type { Application } from "../application";
import type { ProjectReflection } from "../models";
import { defaultTheme } from "./theme";
import { remove } from "../utils/fs";

export class Renderer {
  /**
   * Hooks which plugins can use to modify the rendered output.
   */
  readonly hooks = new EventHooks<TemplateHooks, VNode | null>();

  constructor(readonly application: Application) {}

  async render(project: ProjectReflection, out: string): Promise<void> {
    if (this.application.options.getValue("cleanOutputDir")) {
      await remove(out);
    }

    await defaultTheme(this.application, project, out);
  }
}
