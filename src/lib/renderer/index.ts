import { EventHooks } from "../utils/hooks";
import { TemplateHooks } from "./templates";
import { VNode } from "preact";
import { Application } from "../application";
import { ProjectReflection } from "../models";
import { defaultTheme } from "./theme";

export class Renderer {
  /**
   * Hooks which plugins can use to modify the rendered output.
   */
  readonly hooks = new EventHooks<TemplateHooks, VNode | null>();

  constructor(readonly application: Application) {}

  async render(project: ProjectReflection, out: string) {
    await defaultTheme(this.application, project, out);
  }
}
